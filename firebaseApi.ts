
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser, deleteUser, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { doc, collection, onSnapshot, addDoc, deleteDoc, setDoc, getDoc, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { CycleSettings, PeriodEntry, SymptomLog, ActivityLog, User, AppNotification } from './types';
import { isSameDay, parseISO } from 'date-fns';


// ========================================================================
// API Service for Firebase (with Local Storage Mock Support)
// ========================================================================

// DETECT IF FIREBASE IS CONFIGURED OR IF WE SHOULD USE MOCK MODE
const isMockMode = !auth.app.options.apiKey || auth.app.options.apiKey === "VOTRE_API_KEY_ICI" || auth.app.options.apiKey.includes("VOTRE_");

// Flag to prevent onAuthChange from signing out during the critical signup/resend phase
let isSigningUp = false;

if (isMockMode) {
    console.warn("Mon Cycle: Running in DEMO/MOCK mode because Firebase is not configured. Data will be saved to LocalStorage.");
}

// ------------------------------------------------------------------------
// MOCK IMPLEMENTATION HELPERS (LOCAL STORAGE)
// ------------------------------------------------------------------------

const mockDb: any = {
    listeners: {} as Record<string, Function[]>,
    authCallbacks: [] as ((user: any, userData: any) => void)[]
};

// Key generator for localStorage
const getStorageKey = (collection: string, docId?: string) => `moncycle:${collection}${docId ? `:${docId}` : ''}`;

// Notify listeners for a specific key
const notifyMockListeners = (key: string, data: any) => {
    if (mockDb.listeners[key]) {
        mockDb.listeners[key].forEach((cb: any) => cb(data));
    }
};

// Mock Auth State Trigger
const triggerAuthChange = () => {
    const userJson = localStorage.getItem('moncycle:auth:current');
    const user = userJson ? JSON.parse(userJson) : null;
    
    mockDb.authCallbacks.forEach((cb: any) => {
        if (user) {
            // User is logged in, fetch their profile data
            const userProfileJson = localStorage.getItem(`moncycle:users:${user.uid}`);
            const userData = userProfileJson ? JSON.parse(userProfileJson) : { name: user.displayName || 'User', email: user.email, photoURL: user.photoURL };
            cb(user, userData);
        } else {
            cb(null, null);
        }
    });
};

// ------------------------------------------------------------------------
// AUTHENTICATION FUNCTIONS
// ------------------------------------------------------------------------

export const onAuthChange = (callback: (user: FirebaseUser | null, userData: User | null) => void) => {
    if (isMockMode) {
        mockDb.authCallbacks.push(callback);
        triggerAuthChange(); // Initial check
        return () => { mockDb.authCallbacks = mockDb.authCallbacks.filter((c: any) => c !== callback); };
    } else {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Check if email is verified
                if (!firebaseUser.emailVerified && !isMockMode) {
                    // Critical Fix: Only force sign out if we are NOT in the middle of signing up or resending email.
                    // This allows sendEmailVerification to work before we kick the user out.
                    if (!isSigningUp) {
                        await signOut(auth);
                    }
                    callback(null, null);
                    return;
                }
                
                try {
                    // Try to get user data from Firestore first
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as User;
                        // Use photoURL from Auth if not in Firestore, or vice versa. 
                        callback(firebaseUser, { 
                            name: userData.name, 
                            email: firebaseUser.email!,
                            photoURL: userData.photoURL || firebaseUser.photoURL || undefined
                        });
                    } else {
                        // SYNC: If user is logged in but no doc exists, create it now (e.g. legacy users or manual auth)
                        const newUserData = { 
                            name: firebaseUser.displayName || 'Utilisateur', 
                            email: firebaseUser.email!,
                            photoURL: firebaseUser.photoURL || null,
                            createdAt: new Date().toISOString()
                        };
                        
                        await setDoc(userDocRef, newUserData, { merge: true });
                        
                        callback(firebaseUser, {
                            name: newUserData.name,
                            email: newUserData.email,
                            photoURL: newUserData.photoURL || undefined
                        });
                    }
                } catch (e) {
                    console.error("Auth/Firestore connection failed", e);
                    // Fallback to minimal auth data on error
                    callback(firebaseUser, { 
                        name: firebaseUser.displayName || 'Utilisateur', 
                        email: firebaseUser.email!,
                        photoURL: firebaseUser.photoURL || undefined
                    });
                }
            } else {
                callback(null, null);
            }
        });
    }
};

export const apiLogin = async (email: string, password: string) => {
    if (isMockMode) {
        // Simple mock login: checks if user exists in local storage 'moncycle:users_list'
        const usersList = JSON.parse(localStorage.getItem('moncycle:users_list') || '[]');
        const foundUser = usersList.find((u: any) => u.email === email && u.password === password);
        
        if (foundUser) {
            const firebaseUserLike = { uid: foundUser.uid, email: foundUser.email, displayName: foundUser.name, photoURL: foundUser.photoURL, emailVerified: true };
            localStorage.setItem('moncycle:auth:current', JSON.stringify(firebaseUserLike));
            triggerAuthChange();
            return { user: firebaseUserLike };
        } else {
            throw { code: 'auth/invalid-credential', message: "Utilisateur non trouvé ou mot de passe incorrect (Mode Démo)" };
        }
    } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Enforce email verification strict check
        if (!result.user.emailVerified) {
           await signOut(auth);
           throw { code: 'auth/email-not-verified', message: "Veuillez vérifier votre email avant de vous connecter." };
        }
        return result;
    }
};

export const signInWithGoogle = async () => {
    if (isMockMode) {
        // Mock Google Login
        const mockUser = {
            uid: `google-user-${Date.now()}`,
            email: 'demo-google@gmail.com',
            displayName: 'Demo Google User',
            photoURL: 'https://ui-avatars.com/api/?name=Google+User&background=random',
            emailVerified: true
        };
        
        localStorage.setItem('moncycle:auth:current', JSON.stringify(mockUser));
        
        // Initialize profile in mock db if not exists
        const userKey = getStorageKey(`users:${mockUser.uid}`);
        if (!localStorage.getItem(userKey)) {
             localStorage.setItem(userKey, JSON.stringify({ name: mockUser.displayName, email: mockUser.email, photoURL: mockUser.photoURL }));
             const defaultSettings: CycleSettings = {
                cycleLength: 28, periodLength: 5,
                notifications: { period: true, ovulation: true, custom: { beforePeriod: { enabled: false, days: 2 }, beforeOvulation: { enabled: false, days: 1 } } }
             };
             saveSettings(mockUser.uid, defaultSettings, false);
        }
        
        triggerAuthChange();
        return { user: mockUser };
    } else {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const { user } = result;
            const additionalInfo = getAdditionalUserInfo(result);
            
            // Sync user data to Firestore (always, to ensure fields are up to date)
            await setDoc(doc(db, 'users', user.uid), {
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastLogin: new Date().toISOString()
            }, { merge: true });

            // If it's a new user, initialize their settings
            if (additionalInfo?.isNewUser) {
                 const defaultSettings: CycleSettings = {
                    cycleLength: 28, periodLength: 5,
                    notifications: { period: true, ovulation: true, custom: { beforePeriod: { enabled: false, days: 2 }, beforeOvulation: { enabled: false, days: 1 } } }
                };
                await setDoc(doc(db, 'users', user.uid, 'data', 'settings'), defaultSettings);
            }
            return result;
        } catch (error) {
            console.error("Google Sign In Error", error);
            throw error;
        }
    }
};

export const resendVerificationEmail = async (email: string, password: string) => {
    if (isMockMode) {
        console.log("Mock email resent to", email);
        return;
    }
    
    // Set flag to prevent onAuthChange from signing out immediately
    isSigningUp = true;
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        await signOut(auth);
    } catch (error) {
        console.error("Error resending verification email", error);
        throw error;
    } finally {
        isSigningUp = false;
    }
};

export const resetPassword = async (email: string) => {
    if (isMockMode) {
        console.log("Mock password reset link sent to", email);
        return Promise.resolve();
    } else {
        return sendPasswordResetEmail(auth, email);
    }
};

export const apiSignup = async (userData: { name: string, email: string, password: string, photo?: File | null }) => {
    if (isMockMode) {
        // Mock Signup
        const usersList = JSON.parse(localStorage.getItem('moncycle:users_list') || '[]');
        if (usersList.find((u: any) => u.email === userData.email)) {
             throw { code: 'auth/email-already-in-use', message: "Email déjà utilisé (Mode Démo)" };
        }

        const newUserUid = `mock-user-${Date.now()}`;
        
        // Handle mock photo "upload" (create a fake URL)
        let photoURL = undefined;
        if (userData.photo) {
            photoURL = "https://ui-avatars.com/api/?name=" + userData.name + "&background=random";
        }

        const newUser = { ...userData, uid: newUserUid, photoURL };
        
        // Save to users list
        usersList.push(newUser);
        localStorage.setItem('moncycle:users_list', JSON.stringify(usersList));

        // Save profile
        localStorage.setItem(`moncycle:users:${newUserUid}`, JSON.stringify({ name: userData.name, email: userData.email, photoURL }));

        // Initialize default settings
        const defaultSettings: CycleSettings = {
            cycleLength: 28, periodLength: 5,
            notifications: { period: true, ovulation: true, custom: { beforePeriod: { enabled: false, days: 2 }, beforeOvulation: { enabled: false, days: 1 } } }
        };
        saveSettings(newUserUid, defaultSettings, false); // Use mocked saveSettings

        console.log("Mock email verification sent to:", userData.email);

        return { user: { email: userData.email } };

    } else {
        isSigningUp = true;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const { user } = userCredential;
            
            let photoURL = null;

            // Upload photo if provided
            if (userData.photo) {
                const storageRef = ref(storage, `profile_images/${user.uid}`);
                await uploadBytes(storageRef, userData.photo);
                photoURL = await getDownloadURL(storageRef);
            }

            // Update Auth Profile
            await updateProfile(user, { 
                displayName: userData.name,
                photoURL: photoURL 
            });

            // CREATE USER DOCUMENT IN FIRESTORE
            await setDoc(doc(db, 'users', user.uid), {
                name: userData.name,
                email: userData.email,
                photoURL: photoURL,
                createdAt: new Date().toISOString()
            });

            // Initialize default settings
            const defaultSettings: CycleSettings = {
                cycleLength: 28, periodLength: 5,
                notifications: { period: true, ovulation: true, custom: { beforePeriod: { enabled: false, days: 2 }, beforeOvulation: { enabled: false, days: 1 } } }
            };
            await setDoc(doc(db, 'users', user.uid, 'data', 'settings'), defaultSettings);
            
            // Send Verification Email
            await sendEmailVerification(user);

            // Sign out immediately to prevent auto-login
            await signOut(auth);
            return userCredential;
            
        } catch (error) {
            console.error("Error setting up user profile or sending verification:", error);
            // ROLLBACK: Delete the user if setup failed, so they can try signing up again.
            if (auth.currentUser) {
                try {
                    await deleteUser(auth.currentUser);
                } catch (cleanupError) {
                    console.warn("Failed to cleanup user after failed signup:", cleanupError);
                }
            }
            throw error;
        } finally {
            isSigningUp = false;
        }
    }
};

export const updateUserProfile = async (firebaseUser: FirebaseUser, data: { displayName?: string, photo?: File | null }) => {
    if (isMockMode) {
        const key = getStorageKey(`users:${firebaseUser.uid}`);
        const current = JSON.parse(localStorage.getItem(key) || '{}');
        let photoURL = current.photoURL;
        
        if (data.photo) {
             photoURL = "https://ui-avatars.com/api/?name=" + (data.displayName || current.name) + "&background=random";
        }
        
        const updated = { ...current, name: data.displayName || current.name, photoURL };
        localStorage.setItem(key, JSON.stringify(updated));
        
        // Update user list for login mock
        const usersListKey = 'moncycle:users_list';
        const usersList = JSON.parse(localStorage.getItem(usersListKey) || '[]');
        const index = usersList.findIndex((u: any) => u.uid === firebaseUser.uid);
        if (index !== -1) {
            usersList[index] = { ...usersList[index], name: updated.name, photoURL: updated.photoURL };
            localStorage.setItem(usersListKey, JSON.stringify(usersList));
        }
        
        triggerAuthChange();
        return updated.photoURL;
    } else {
        let photoURL = firebaseUser.photoURL;
        if (data.photo) {
            const storageRef = ref(storage, `profile_images/${firebaseUser.uid}`);
            await uploadBytes(storageRef, data.photo);
            photoURL = await getDownloadURL(storageRef);
        }

        await updateProfile(firebaseUser, {
            displayName: data.displayName || firebaseUser.displayName,
            photoURL: photoURL
        });
        
        // Sync to Firestore
        try {
             const userDocRef = doc(db, 'users', firebaseUser.uid);
             await setDoc(userDocRef, { 
                 name: data.displayName || firebaseUser.displayName, 
                 photoURL: photoURL 
             }, { merge: true });
        } catch(e: any) {
            if (e.code === 'permission-denied') {
                console.error("Firestore Permission Error: Check your Firestore Security Rules in the Firebase Console. You need to allow write access to 'users/{userId}'.");
            }
            console.warn("Could not sync profile to firestore", e);
        }

        return photoURL;
    }
};

export const deleteUserAccount = async (firebaseUser: FirebaseUser) => {
    if (isMockMode) {
        // Mock Deletion
        localStorage.removeItem('moncycle:auth:current');
        localStorage.removeItem(`moncycle:users:${firebaseUser.uid}`);
        localStorage.removeItem(`moncycle:data:${firebaseUser.uid}:settings`);
        localStorage.removeItem(`moncycle:data:${firebaseUser.uid}:periodHistory`);
        localStorage.removeItem(`moncycle:data:${firebaseUser.uid}:symptomHistory`);
        localStorage.removeItem(`moncycle:data:${firebaseUser.uid}:activityHistory`);
        localStorage.removeItem(`moncycle:data:${firebaseUser.uid}:appNotifications`);
        
        const usersListKey = 'moncycle:users_list';
        let usersList = JSON.parse(localStorage.getItem(usersListKey) || '[]');
        usersList = usersList.filter((u: any) => u.uid !== firebaseUser.uid);
        localStorage.setItem(usersListKey, JSON.stringify(usersList));
        
        triggerAuthChange();
    } else {
        // 1. Delete Firestore User Document
        // Note: This only deletes the root document. Subcollections might technically remain 
        // in Firestore unless manually deleted, but will be orphaned.
        try {
            await deleteDoc(doc(db, 'users', firebaseUser.uid));
        } catch(e) {
            console.error("Error deleting user document", e);
        }

        // 2. Delete Profile Photo from Storage
        if (firebaseUser.photoURL && firebaseUser.photoURL.includes('firebasestorage')) {
            try {
                const storageRef = ref(storage, `profile_images/${firebaseUser.uid}`);
                await deleteObject(storageRef);
            } catch (e) {
                console.warn("Profile photo not found or error deleting it", e);
            }
        }

        // 3. Delete Authentication Account
        await deleteUser(firebaseUser);
    }
};

export const apiLogout = async () => {
    if (isMockMode) {
        localStorage.removeItem('moncycle:auth:current');
        triggerAuthChange();
    } else {
        return signOut(auth);
    }
};

// ------------------------------------------------------------------------
// DATA SUBSCRIPTIONS (READ)
// ------------------------------------------------------------------------

// Helper to subscribe to a Mock Collection (Array in LocalStorage)
const mockSubscribeCollection = <T>(userId: string, collectionName: string, sortFn: (a: T, b: T) => number, callback: (data: T[]) => void) => {
    const key = getStorageKey(`data:${userId}:${collectionName}`);
    
    const listener = (newData: T[]) => {
        callback([...(newData || [])].sort(sortFn));
    };

    // Register
    if (!mockDb.listeners[key]) mockDb.listeners[key] = [];
    mockDb.listeners[key].push(listener);

    // Initial Call
    const currentData = JSON.parse(localStorage.getItem(key) || '[]');
    listener(currentData);

    // Unsubscribe
    return () => { mockDb.listeners[key] = mockDb.listeners[key].filter((l: any) => l !== listener); };
};


const subscribeToCollection = <T>(userId: string, collectionName: string, orderByField: string, orderDirection: 'asc' | 'desc' = 'asc', callback: (data: T[]) => void) => {
    if (isMockMode) {
        // Mock Sorting
        const sortFn = (a: any, b: any) => {
            if (a[orderByField] < b[orderByField]) return orderDirection === 'asc' ? -1 : 1;
            if (a[orderByField] > b[orderByField]) return orderDirection === 'asc' ? 1 : -1;
            return 0;
        };
        return mockSubscribeCollection(userId, collectionName, sortFn, callback);
    } else {
        const q = query(collection(db, 'users', userId, collectionName), orderBy(orderByField, orderDirection));
        return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
            callback(data);
        }, (error: any) => {
            if (error.code === 'permission-denied') {
                console.error(`Error subscribing to ${collectionName}: Permission Denied. Check rules.`);
            } else {
                console.error(`Error subscribing to ${collectionName}:`, error);
            }
        });
    }
};

export const subscribeToSettings = (userId: string, callback: (data: CycleSettings | null, pregnancyMode: boolean) => void) => {
    if (isMockMode) {
        const key = getStorageKey(`data:${userId}:settings`);
        const listener = (data: any) => {
            if (data) callback(data, data.isPregnancyMode || false);
            else callback(null, false);
        };
        
        if (!mockDb.listeners[key]) mockDb.listeners[key] = [];
        mockDb.listeners[key].push(listener);
        
        const currentData = JSON.parse(localStorage.getItem(key) || 'null');
        listener(currentData);

        return () => { mockDb.listeners[key] = mockDb.listeners[key].filter((l: any) => l !== listener); };
    } else {
        const settingsRef = doc(db, 'users', userId, 'data', 'settings');
        return onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as CycleSettings & { isPregnancyMode?: boolean };
                callback(data, data.isPregnancyMode || false);
            } else {
                callback(null, false);
            }
        }, (error: any) => {
            if (error.code === 'permission-denied') {
                console.error("Error subscribing to settings: Permission Denied. Check rules.");
            } else {
                console.error("Error subscribing to settings:", error);
            }
        });
    }
};

export const subscribeToPeriodHistory = (userId: string, callback: (data: PeriodEntry[]) => void) => {
    return subscribeToCollection<PeriodEntry>(userId, 'periodHistory', 'startDate', 'asc', callback);
};

export const subscribeToSymptomHistory = (userId: string, callback: (data: SymptomLog[]) => void) => {
    return subscribeToCollection<SymptomLog>(userId, 'symptomHistory', 'date', 'asc', callback);
};

export const subscribeToActivityHistory = (userId: string, callback: (data: ActivityLog[]) => void) => {
    return subscribeToCollection<ActivityLog>(userId, 'activityHistory', 'date', 'asc', callback);
};

export const subscribeToAppNotifications = (userId: string, callback: (data: AppNotification[]) => void) => {
    return subscribeToCollection<AppNotification>(userId, 'appNotifications', 'date', 'desc', callback);
};

// ------------------------------------------------------------------------
// DATA OPERATIONS (WRITE)
// ------------------------------------------------------------------------

// Helper to update Mock Collection
const mockAddToCollection = (userId: string, collectionName: string, item: any) => {
    const key = getStorageKey(`data:${userId}:${collectionName}`);
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const newItem = { ...item, id: `local-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    list.push(newItem);
    localStorage.setItem(key, JSON.stringify(list));
    notifyMockListeners(key, list);
    return Promise.resolve({ id: newItem.id }); // Return a fake doc ref
};

const mockRemoveFromCollection = (userId: string, collectionName: string, itemId: string) => {
    const key = getStorageKey(`data:${userId}:${collectionName}`);
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list = list.filter((i: any) => i.id !== itemId);
    localStorage.setItem(key, JSON.stringify(list));
    notifyMockListeners(key, list);
    return Promise.resolve();
};

const mockUpdateInCollection = (userId: string, collectionName: string, itemId: string, data: any) => {
    const key = getStorageKey(`data:${userId}:${collectionName}`);
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const index = list.findIndex((i: any) => i.id === itemId);
    if (index !== -1) {
        list[index] = { ...list[index], ...data };
        localStorage.setItem(key, JSON.stringify(list));
        notifyMockListeners(key, list);
    }
    return Promise.resolve();
};

export const saveSettings = (userId: string, settings: CycleSettings, isPregnancyMode: boolean) => {
    if (isMockMode) {
        const key = getStorageKey(`data:${userId}:settings`);
        const data = { ...settings, isPregnancyMode };
        localStorage.setItem(key, JSON.stringify(data));
        notifyMockListeners(key, data);
        return Promise.resolve();
    } else {
        const settingsRef = doc(db, 'users', userId, 'data', 'settings');
        return setDoc(settingsRef, { ...settings, isPregnancyMode }, { merge: true });
    }
};

export const addPeriodEntry = (userId: string, date: Date) => {
    if (isMockMode) {
        return mockAddToCollection(userId, 'periodHistory', { startDate: date.toISOString() });
    } else {
        const newEntry = { startDate: date.toISOString() };
        return addDoc(collection(db, 'users', userId, 'periodHistory'), newEntry);
    }
};

export const updatePeriodEntry = (userId: string, periodId: string, endDate: Date) => {
    const data = { endDate: endDate.toISOString() };
    if (isMockMode) {
        return mockUpdateInCollection(userId, 'periodHistory', periodId, data);
    } else {
        return setDoc(doc(db, 'users', userId, 'periodHistory', periodId), data, { merge: true });
    }
};

export const removePeriodEntry = (userId: string, periodId: string) => {
    if (isMockMode) {
        return mockRemoveFromCollection(userId, 'periodHistory', periodId);
    } else {
        return deleteDoc(doc(db, 'users', userId, 'periodHistory', periodId));
    }
};

export const saveSymptomLog = async (userId: string, log: Omit<SymptomLog, 'id'>, currentHistory: SymptomLog[]) => {
    if (isMockMode) {
        const existingLog = currentHistory.find(s => isSameDay(parseISO(s.date), parseISO(log.date)));
        if (existingLog) {
            return mockUpdateInCollection(userId, 'symptomHistory', existingLog.id, log);
        }
        return mockAddToCollection(userId, 'symptomHistory', log);
    } else {
        const existingLog = currentHistory.find(s => isSameDay(parseISO(s.date), parseISO(log.date)));
        if (existingLog) {
            return setDoc(doc(db, 'users', userId, 'symptomHistory', existingLog.id), log, { merge: true });
        }
        return addDoc(collection(db, 'users', userId, 'symptomHistory'), log);
    }
};

export const addActivityLog = (userId: string, date: Date, note?: string) => {
    const data = { date: date.toISOString(), note: note || '' };
    if (isMockMode) {
        return mockAddToCollection(userId, 'activityHistory', data);
    } else {
        return addDoc(collection(db, 'users', userId, 'activityHistory'), data);
    }
};

export const removeActivityLog = (userId: string, activityId: string) => {
    if (isMockMode) {
        return mockRemoveFromCollection(userId, 'activityHistory', activityId);
    } else {
        return deleteDoc(doc(db, 'users', userId, 'activityHistory', activityId));
    }
};

export const togglePregnancyMode = (userId: string, newMode: boolean) => {
    if (isMockMode) {
        const key = getStorageKey(`data:${userId}:settings`);
        const current = JSON.parse(localStorage.getItem(key) || '{}');
        const updated = { ...current, isPregnancyMode: newMode };
        localStorage.setItem(key, JSON.stringify(updated));
        notifyMockListeners(key, updated);
        return Promise.resolve();
    } else {
        const settingsRef = doc(db, 'users', userId, 'data', 'settings');
        return setDoc(settingsRef, { isPregnancyMode: newMode }, { merge: true });
    }
};

export const addAppNotification = (userId: string, message: string) => {
    if (isMockMode) {
        return mockAddToCollection(userId, 'appNotifications', { message, date: new Date().toISOString(), read: false });
    } else {
        const newNotif = { message, date: new Date().toISOString(), read: false };
        return addDoc(collection(db, 'users', userId, 'appNotifications'), newNotif);
    }
};

export const markNotificationsAsRead = async (userId: string, notifications: AppNotification[]) => {
    if (isMockMode) {
        const unreadNotifs = notifications.filter(n => !n.read);
        const promises = unreadNotifs.map(notif => 
             mockUpdateInCollection(userId, 'appNotifications', notif.id, { read: true })
        );
        return Promise.all(promises);
    } else {
        const unreadNotifs = notifications.filter(n => !n.read);
        const promises = unreadNotifs.map(notif => {
            const notifRef = doc(db, 'users', userId, 'appNotifications', notif.id);
            return setDoc(notifRef, { read: true }, { merge: true });
        });
        return Promise.all(promises);
    }
};
