import React, { useState, useEffect, createContext, useContext } from 'react';
// Removed direct import for @supabase/supabase-js to load it via CDN script tag

import { Home, User, LogOut, BookOpen, PlusCircle, LayoutDashboard, Search, CheckCircle, Download } from 'lucide-react';

// Supabase Configuration (replace with your actual values if different)
const supabaseUrl = 'https://gawllbktmwswzmvzzpmq.supabase.co';
// IMPORTANT: Replace 'YOUR_ACTUAL_SUPABASE_ANON_PUBLIC_KEY_HERE' with your actual anon public key from Supabase Project Settings -> API
// You can find this in your Supabase project settings under "API" -> "Project API keys" -> "anon public"
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhd2xsYmt0bXdzd3ptdnp6cG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Nzc4MTksImV4cCI6MjA2NzE1MzgxOX0.HhDaRGuzP_eyFyrM3ABz29LPkseCEGrQcHZNcjWZazI'; 

// Create a context for Supabase and User data
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [supabaseClient, setSupabaseClient] = useState(null); // State to hold the Supabase client instance
    const [session, setSession] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scriptsLoaded, setScriptsLoaded] = useState(false); // New state to track CDN script loading

    // Effect to load CDN scripts (Tailwind and Supabase)
    useEffect(() => {
        console.log('AppProvider: Attempting to load CDN scripts...');
        const tailwindScript = document.createElement('script');
        tailwindScript.src = 'https://cdn.tailwindcss.com';
        document.head.appendChild(tailwindScript);

        const supabaseScript = document.createElement('script');
        supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.x.x/dist/umd/supabase.min.js'; // UMD build for global access
        supabaseScript.onload = () => {
            console.log('AppProvider: Supabase script loaded successfully.');
            setScriptsLoaded(true); // Mark Supabase script as loaded
        };
        supabaseScript.onerror = (e) => {
            console.error('AppProvider: Error loading Supabase script:', e);
            // Even if script fails, we might want to proceed or show an error message
            // For now, let's keep loading true if it:// Even if script fails, we might want to proceed or show an error message
            // For now, let's keep loading true if it fails, or handle specific error UI
        };
        document.head.appendChild(supabaseScript);

        return () => {
            console.log('AppProvider: Cleaning up CDN scripts.');
            document.head.removeChild(tailwindScript);
            document.head.removeChild(supabaseScript);
        };
    }, []); // Run once on component mount

    // Effect to initialize Supabase client and fetch initial session/profile
    useEffect(() => {
        console.log('AppProvider: scriptsLoaded state changed:', scriptsLoaded);
        // Only proceed if scripts are loaded and window.supabase.createClient is available
        if (scriptsLoaded && window.supabase && window.supabase.createClient && !supabaseClient) {
            console.log('AppProvider: Initializing Supabase client...');
            const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            setSupabaseClient(client);
            console.log('AppProvider: Supabase client set.');
        } else if (scriptsLoaded && !window.supabase) {
            console.error('AppProvider: Supabase object not found on window after script load. Check script URL or content.');
            setLoading(false); // Stop loading if Supabase global is not available
        }
    }, [scriptsLoaded, supabaseClient]); // Depend on scriptsLoaded and supabaseClient state

    // Effect to handle session and profile fetching once supabaseClient is ready
    useEffect(() => {
        const fetchSessionAndProfile = async () => {
            if (!supabaseClient) {
                console.log('AppProvider: fetchSessionAndProfile skipped, Supabase client not ready.');
                return; // Wait for client to be initialized
            }

            setLoading(true); // Ensure loading is true at the start of this critical fetch
            console.log('AppProvider: Starting fetchSessionAndProfile...');
            try {
                const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
                if (sessionError) {
                    console.error('AppProvider: Error getting session:', sessionError);
                    setSession(null);
                    setUserProfile(null);
                    setLoading(false);
                    return;
                }
                setSession(session);
                console.log('AppProvider: Session fetched:', session);

                if (session) {
                    const { data: profile, error: profileError } = await supabaseClient
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    if (profileError && profile === null) { // If there's an error AND data is null, it's likely "0 rows"
                        console.log('AppProvider: Profile not found for user (or multiple profiles found), setting profile to null:', profileError);
                        setUserProfile(null);
                    } else if (profileError) { // Other types of errors
                        console.error('AppProvider: Error fetching profile:', profileError);
                        setUserProfile(null);
                    } else { // Profile found
                        console.log('AppProvider: Profile fetched:', profile);
                        setUserProfile(profile);
                    }
                } else {
                    console.log('AppProvider: No session found, user is logged out.');
                    setUserProfile(null);
                }
            } catch (error) {
                console.error('AppProvider: Error during initial session/profile fetch:', error);
            } finally {
                console.log('AppProvider: fetchSessionAndProfile finished, setting loading to false.');
                setLoading(false);
            }
        };

        fetchSessionAndProfile();

        // Set up auth listener
        let authListener = null;
        if (supabaseClient) {
            console.log('AppProvider: Setting up auth state change listener.');
            authListener = supabaseClient.auth.onAuthStateChange(
                async (_event, session) => {
                    console.log('AppProvider: Auth state changed. Event:', _event, 'Session:', session);
                    setSession(session);
                    if (session) {
                        const { data: profile, error: profileError } = await supabaseClient
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();
                        if (profileError && profile === null) {
                            console.log('AppProvider: Profile not found on auth change, setting profile to null:', profileError);
                            setUserProfile(null);
                        } else if (profileError) {
                            console.error('AppProvider: Error fetching profile on auth change:', profileError);
                            setUserProfile(null);
                        } else {
                            console.log('AppProvider: Profile fetched on auth change:', profile);
                            setUserProfile(profile);
                        }
                    } else {
                        console.log('AppProvider: No session on auth change, user is logged out.');
                        setUserProfile(null);
                    }
                    // setLoading(false); // This might be problematic if other async ops are still running
                }
            );
        }

        return () => {
            if (authListener && authListener.data && authListener.data.subscription) {
                console.log('AppProvider: Unsubscribing from auth listener.');
                authListener.data.subscription.unsubscribe();
            }
        };
    }, [supabaseClient]); // Depend on supabaseClient state

    // Overall loading state includes waiting for scripts and initial data
    const overallLoading = loading || !scriptsLoaded || !supabaseClient;
    // Added a version identifier to the log
    console.log(`AppProvider: Current loading state: ${overallLoading} (loading: ${loading}, scriptsLoaded: ${scriptsLoaded}, supabaseClient: ${!!supabaseClient}) [App v2.2]`);


    return (
        <AppContext.Provider value={{ supabase: supabaseClient, session, userProfile, loading: overallLoading, setUserProfile }}>
            {children}
        </AppContext.Provider>
    );
};

// Custom Hook for Navigation
const useNavigation = () => {
    const [currentPage, setCurrentPage] = useState('home'); // Default page
    return { currentPage, setCurrentPage };
};

// --- Components ---

// Auth Page (Login & Signup)
const AuthPage = ({ setCurrentPage }) => {
    const { supabase, setUserProfile } = useContext(AppContext);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [selectedExams, setSelectedExams] = useState([]); // New state for exam selection
    const availableExams = ['IELTS', 'PTE', 'SAT']; // Available exam options

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleExamSelection = (exam) => {
        setSelectedExams((prev) =>
            prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]
        );
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!supabase) {
            setMessage('Supabase client not initialized. Please wait or refresh.');
            setLoading(false);
            return;
        }

        if (isLogin) {
            console.log('AuthPage: Attempting to sign in...');
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            console.log('AuthPage: signInWithPassword result - data:', data, 'error:', error);

            if (error) {
                setMessage(error.message);
            } else {
                // Fetch profile to set the userProfile in context
                console.log('AuthPage: Signed in successfully. Attempting to fetch profile for user ID:', data.user.id);
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                console.log('AuthPage: Profile fetch result - profile:', profile, 'error:', profileError);

                if (profileError && profile === null) { // If there's an error AND data is null, it's likely "0 rows"
                    console.log('AuthPage: Profile not found after login, setting profile to null:', profileError);
                    setUserProfile(null);
                } else if (profileError) { // Other types of errors
                    console.error('AuthPage: Error fetching profile after login:', profileError);
                    setUserProfile(null);
                } else { // Profile found
                    setUserProfile(profile);
                }
                setMessage('Logged in successfully!');
            }
        } else {
            // Signup flow
            console.log('AuthPage: Attempting to sign up...');
            if (selectedExams.length === 0) {
                setMessage('Please select at least one exam you want to register for.');
                setLoading(false);
                return;
            }
            if (!name.trim()) { // Basic client-side validation for name
                setMessage('Please enter your name.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({ email, password });
            console.log('AuthPage: signUp result - data:', data, 'error:', error);

            if (error) {
                setMessage(error.message);
            } else if (data.user) {
                // User successfully created in auth.users
                console.log('AuthPage: Supabase Auth User created:', data.user); // Log the created user

                const userId = data.user.id; // Use the ID directly from the signUp response
                console.log('AuthPage: User ID from signUp response for profile insert:', userId);

                // Insert profile for new user, including selected exams
                console.log('AuthPage: Attempting to insert new profile with data:', {
                    id: userId, // Use ID from signUp response
                    email: email,
                    name: name,
                    role: 'student', // Default role for new signups
                    registered_exams: selectedExams, // Save selected exams
                });

                try {
                    const { data: insertedProfile, error: profileError } = await supabase.from('profiles').insert({
                        id: userId, // Use ID from signUp response
                        email: email,
                        name: name,
                        role: 'student', // Default role for new signups
                        registered_exams: selectedExams, // Save selected exams
                    }).select(); // Added .select() to get the inserted data back
                    console.log('AuthPage: Profile insert result - insertedProfile:', insertedProfile, 'profileError:', profileError);

                    if (profileError) {
                        // Log the error more thoroughly
                        console.error('AuthPage: Error creating profile (details):', profileError.message || JSON.stringify(profileError));
                        setMessage(`Signup successful, but failed to create profile: ${profileError.message || 'Please check Supabase RLS for "profiles" table and schema.'}`);
                    } else {
                        setMessage('Signup successful! Please check your email for verification.');
                        // Set the newly inserted profile directly into context
                        if (insertedProfile && insertedProfile.length > 0) {
                            setUserProfile(insertedProfile[0]);
                            console.log('AuthPage: User profile set in context after successful signup and insert.');
                        } else {
                            console.warn('AuthPage: Profile insert succeeded, but no data returned. Context might not be fully updated.');
                        }
                    }
                } catch (insertError) {
                    console.error('AuthPage: Unexpected error during profile insert:', insertError);
                    setMessage(`Signup successful, but an unexpected error occurred during profile creation: ${insertError.message}`);
                }
            }
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        if (!supabase) {
            setMessage('Supabase client not initialized. Please wait or refresh.');
            setLoading(false);
            return;
        }
        console.log('AuthPage: Attempting Google OAuth login...');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin, // Redirects back to the app root
            }
        });
        console.log('AuthPage: Google OAuth result - error:', error);
        if (error) {
            setMessage(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    {isLogin ? 'Login' : 'Sign Up'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="authEmail">
                            Email
                        </label>
                        <input
                            type="email"
                            id="authEmail" // Added ID for accessibility
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="authPassword">
                            Password
                        </label>
                        <input
                            type="password"
                            id="authPassword" // Added ID for accessibility
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="authName">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="authName" // Added ID for accessibility
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Select Exams (Multiple allowed)
                                </label>
                                <div className="flex flex-wrap gap-3 p-2 border border-gray-300 rounded-md bg-gray-50">
                                    {availableExams.map((exam) => (
                                        <label key={exam} htmlFor={`exam-${exam}`} className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id={`exam-${exam}`} // Added ID for accessibility
                                                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                                value={exam}
                                                checked={selectedExams.includes(exam)}
                                                onChange={() => handleExamSelection(exam)}
                                            />
                                            <span className="ml-2 text-gray-700 font-medium">{exam}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 flex items-center justify-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.004 9.29072C7.004 8.71872 7.058 8.16972 7.156 7.63972H3.004V10.2717H6.918C6.582 11.9727 5.632 13.3177 4.338 14.1927L4.319 14.3167L6.505 16.0917L6.612 16.1017C8.037 17.2957 9.873 17.9997 12.004 17.9997C15.996 17.9997 19.124 15.3587 19.124 11.9997C19.124 11.5977 19.088 11.2037 19.019 10.8227H12.004V13.8827H16.484C16.273 14.9397 15.688 15.8677 14.851 16.5167L14.773 16.5847L17.004 18.3197L17.103 18.3287C18.665 16.8927 19.789 14.6867 19.789 11.9997C19.789 9.86672 19.155 7.90272 18.069 6.29972L18.004 6.24172L15.908 4.60672L15.792 4.69372C14.475 3.51372 12.836 2.99972 12.004 2.99972C8.012 2.99972 4.884 5.64072 4.884 9.00072C4.884 9.40272 4.92 9.79672 4.989 10.1777H7.004V9.29072Z" />
                        </svg>
                        <span>Login with Google</span>
                    </button>
                </div>
                <p className="text-center text-gray-600 text-sm mt-4">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-500 hover:text-blue-800 font-bold focus:outline-none"
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
                {message && (
                    <div className="mt-4 p-3 bg-blue-100 text-blue-700 rounded text-center">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

// Header Component
const Header = ({ setCurrentPage }) => {
    const { supabase, userProfile } = useContext(AppContext);

    const handleLogout = async () => {
        if (!supabase) return; // Ensure supabase client is available
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error.message);
        else setCurrentPage('auth');
    };

    return (
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-md flex justify-between items-center rounded-b-lg">
            <h1 className="text-xl sm:text-2xl font-extrabold cursor-pointer" onClick={() => setCurrentPage('home')}>LMS Portal</h1>
            <nav className="flex items-center space-x-2 sm:space-x-4">
                {userProfile && (
                    <span className="text-sm sm:text-lg font-medium truncate max-w-[100px] sm:max-w-none">Hello, {userProfile.name || userProfile.email}!</span>
                )}
                <button
                    onClick={() => setCurrentPage('home')}
                    className="flex items-center space-x-1 p-1 sm:p-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Home size={18} className="sm:size-20" />
                    <span className="hidden sm:inline">Home</span>
                </button>
                {userProfile && (
                    <>
                        <button
                            onClick={() => setCurrentPage('profile')}
                            className="flex items-center space-x-1 p-1 sm:p-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <User size={18} className="sm:size-20" />
                            <span className="hidden sm:inline">Profile</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-1 p-1 sm:p-2 rounded-md hover:bg-blue-700 transition-colors bg-red-500 hover:bg-red-600"
                        >
                            <LogOut size={18} className="sm:size-20" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </>
                )}
            </nav>
        </header>
    );
};

// Lesson Creation Form Component
const LessonCreationForm = ({ moduleId, onLessonCreate, fetchCourseDetails }) => {
    const { supabase } = useContext(AppContext);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonContent, setNewLessonContent] = useState('');
    const [newLessonType, setNewLessonType] = useState('text');
    const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
    const [newLessonDocumentUrl, setNewLessonDocumentUrl] = useState('');
    const [newLessonVideoFile, setNewLessonVideoFile] = useState(null); // State for video file upload
    const [newLessonDocumentFile, setNewLessonDocumentFile] = useState(null); // State for document file upload
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleCreateLesson = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('Adding lesson...'); // Provide immediate feedback
        console.log('LessonCreationForm: Starting lesson creation process...');

        if (!newLessonTitle || !newLessonContent) {
            setMessage('Please fill lesson title and content.');
            setLoading(false);
            return;
        }

        let finalVideoUrl = newLessonVideoUrl;
        let finalDocumentUrl = newLessonDocumentUrl;

        console.log('LessonCreationForm: Entering try block for lesson insert.'); // New log before try

        try {
            // Handle video file upload if provided
            if (newLessonType === 'video' && newLessonVideoFile) {
                setMessage('Uploading video file...');
                const videoFilePath = `${moduleId}/videos/${Date.now()}-${newLessonVideoFile.name}`;
                console.log('LessonCreationForm: Attempting video upload to path:', videoFilePath);
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('course-videos')
                    .upload(videoFilePath, newLessonVideoFile);

                if (uploadError) {
                    console.error('LessonCreationForm: Error uploading video file:', uploadError);
                    setMessage(`Error uploading video: ${uploadError.message}`);
                    setLoading(false);
                    return;
                }
                finalVideoUrl = supabase.storage.from('course-videos').getPublicUrl(uploadData.path).data.publicUrl;
                console.log('LessonCreationForm: Video file uploaded. Public URL:', finalVideoUrl);
            }

            // Handle document file upload if provided
            if (newLessonType === 'document' && newLessonDocumentFile) {
                setMessage('Uploading document file...');
                const documentFilePath = `${moduleId}/documents/${Date.now()}-${newLessonDocumentFile.name}`;
                console.log('LessonCreationForm: Attempting document upload to path:', documentFilePath);
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('course-documents')
                    .upload(documentFilePath, newLessonDocumentFile);

                if (uploadError) {
                    console.error('LessonCreationForm: Error uploading document file:', uploadError);
                    setMessage(`Error uploading document: ${uploadError.message}`);
                    setLoading(false);
                    return;
                }
                finalDocumentUrl = supabase.storage.from('course-documents').getPublicUrl(uploadData.path).data.publicUrl;
                console.log('LessonCreationForm: Document file uploaded. Public URL:', finalDocumentUrl);
            }

            console.log('LessonCreationForm: Preparing to insert lesson into database...');
            const lessonDataToInsert = {
                module_id: moduleId,
                title: newLessonTitle,
                content: newLessonContent,
                type: newLessonType,
                video_url: finalVideoUrl,
                document_url: finalDocumentUrl,
                order: 0, // Simplified ordering
            };
            console.log('LessonCreationForm: Data for lessons table insert:', lessonDataToInsert);

            // Directly await the insert operation
            console.log('LessonCreationForm: Attempting Supabase insert...'); // This is the log we need to see!
            console.log('LessonCreationForm: Supabase client object for insert:', supabase); // New: Log the client
            const { data, error } = await supabase.from('lessons').insert([lessonDataToInsert]).select();
            console.log('LessonCreationForm: Supabase insert call completed.'); // This is also NOT appearing

            if (error) {
                console.error('LessonCreationForm: Error creating lesson (details):', error.message || JSON.stringify(error));
                setMessage(`Error creating lesson: ${error.message || 'Unknown error. Check console.'}`);
            } else {
                console.log('LessonCreationForm: Lesson created successfully. Data:', data);
                setMessage('Lesson created successfully!');
                setNewLessonTitle('');
                setNewLessonContent('');
                setNewLessonType('text');
                setNewLessonVideoUrl('');
                setNewLessonDocumentUrl('');
                setNewLessonVideoFile(null); // Clear file input state
                setNewLessonDocumentFile(null); // Clear file input state
                onLessonCreate(data[0]); // Pass the new lesson back to parent
                fetchCourseDetails(); // Trigger a re-fetch of course details in AdminDashboard
            }
        } catch (insertError) {
            console.error('LessonCreationForm: !!! CAUGHT UNEXPECTED ERROR during lesson insert/upload:', insertError); // Enhanced log
            setMessage(`An unexpected error occurred: ${insertError.message}`);
        } finally {
            setLoading(false);
            console.log('LessonCreationForm: Lesson creation process finished.');
        }
    };

    return (
        <div className="border border-dashed border-gray-300 p-4 rounded-md mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-3">Add New Lesson</h4>
            <form onSubmit={handleCreateLesson} className="space-y-3">
                <div>
                    <label htmlFor={`lessonTitle-${moduleId}`} className="block text-sm font-medium text-gray-700">Lesson Title</label>
                    <input
                        type="text"
                        id={`lessonTitle-${moduleId}`} // Added ID for accessibility
                        name={`lessonTitle-${moduleId}`} // Added name for autofill/accessibility
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Lesson Title"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor={`lessonContent-${moduleId}`} className="block text-sm font-medium text-gray-700">Lesson Content</label>
                    <textarea
                        id={`lessonContent-${moduleId}`} // Added ID for accessibility
                        name={`lessonContent-${moduleId}`} // Added name for autofill/accessibility
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Detailed lesson content (text, instructions, etc.)"
                        value={newLessonContent}
                        onChange={(e) => setNewLessonContent(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div>
                    <label htmlFor={`lessonType-${moduleId}`} className="block text-sm font-medium text-gray-700">Lesson Type</label>
                    <select
                        id={`lessonType-${moduleId}`} // Added ID for accessibility
                        name={`lessonType-${moduleId}`} // Added name for autofill/accessibility
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={newLessonType}
                        onChange={(e) => {
                            setNewLessonType(e.target.value);
                            setNewLessonVideoUrl(''); // Clear URLs when type changes
                            setNewLessonDocumentUrl('');
                            setNewLessonVideoFile(null); // Clear file input state
                            setNewLessonDocumentFile(null); // Clear file input state
                        }}
                    >
                        <option value="text">Text</option>
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        {/* <option value="quiz">Quiz</option> */}
                    </select>
                </div>

                {newLessonType === 'video' && (
                    <>
                        <div>
                            <label htmlFor={`newLessonVideoUrl-${moduleId}`} className="block text-sm font-medium text-gray-700">Video URL (Optional)</label>
                            <input
                                type="url"
                                id={`newLessonVideoUrl-${moduleId}`} // Added ID for accessibility
                                name={`newLessonVideoUrl-${moduleId}`} // Added name for autofill/accessibility
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ or direct .mp4 link"
                                value={newLessonVideoUrl}
                                onChange={(e) => {
                                    setNewLessonVideoUrl(e.target.value);
                                    setNewLessonVideoFile(null); // Clear file if URL is typed
                                }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Paste a YouTube link or a direct link to a video file (.mp4, .webm, etc.).
                            </p>
                        </div>
                        <div className="mt-2">
                            <label htmlFor={`newLessonVideoFile-${moduleId}`} className="block text-sm font-medium text-gray-700">Or Upload Video from System</label>
                            <input
                                type="file"
                                id={`newLessonVideoFile-${moduleId}`} // Added ID for accessibility
                                name={`newLessonVideoFile-${moduleId}`} // Added name for autofill/accessibility
                                accept="video/*"
                                onChange={(e) => {
                                    setNewLessonVideoFile(e.target.files[0]);
                                    setNewLessonVideoUrl(''); // Clear URL if file is selected
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </>
                )}
                {newLessonType === 'document' && (
                    <>
                        <div>
                            <label htmlFor={`newLessonDocumentUrl-${moduleId}`} className="block text-sm font-medium text-gray-700">Document URL (Optional)</label>
                            <input
                                type="url"
                                id={`newLessonDocumentUrl-${moduleId}`} // Added ID for accessibility
                                name={`newLessonDocumentUrl-${moduleId}`} // Added name for autofill/accessibility
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                placeholder="e.g., https://example.com/document.pdf"
                                value={newLessonDocumentUrl}
                                onChange={(e) => {
                                    setNewLessonDocumentUrl(e.target.value);
                                    setNewLessonDocumentFile(null); // Clear file if URL is typed
                                }}
                            />
                        </div>
                        <div className="mt-2">
                            <label htmlFor={`newLessonDocumentFile-${moduleId}`} className="block text-sm font-medium text-gray-700">Or Upload Document from System</label>
                            <input
                                type="file"
                                id={`newLessonDocumentFile-${moduleId}`} // Added ID for accessibility
                                name={`newLessonDocumentFile-${moduleId}`} // Added name for autofill/accessibility
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={(e) => {
                                    setNewLessonDocumentFile(e.target.files[0]);
                                    setNewLessonDocumentUrl(''); // Clear URL if file is selected
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                    disabled={loading}
                >
                    {loading ? 'Adding...' : 'Add Lesson'}
                </button>
            </form>
            {message && (
                <div className="mt-3 p-2 bg-blue-100 text-blue-700 rounded text-sm">
                    {message}
                </div>
            )}
        </div>
    );
};


// Admin Dashboard
const AdminDashboard = ({ setCurrentPage }) => {
    const { supabase, userProfile } = useContext(AppContext);
    const [courses, setCourses] = useState([]);
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseDescription, setNewCourseDescription] = useState('');
    const [newCourseExamType, setNewCourseExamType] = useState(''); // New state for exam type
    const availableExams = ['IELTS', 'PTE', 'SAT']; // Available exam options for course creation

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [newModuleName, setNewModuleName] = useState('');

    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');

    useEffect(() => {
        if (supabase) { // Ensure supabase client is available before fetching
            fetchCourses();
        }
    }, [supabase]); // Depend on supabase client

    const fetchCourses = async () => {
        if (!supabase) return;
        const { data, error } = await supabase.from('courses').select('*');
        if (error) console.error('Error fetching courses:', error);
        else setCourses(data);
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!newCourseTitle || !newCourseDescription || !newCourseExamType || !userProfile?.id || !supabase) {
            alert('Please fill all course details, including exam type.');
            return;
        }

        const { data, error } = await supabase.from('courses').insert([
            {
                title: newCourseTitle,
                description: newCourseDescription,
                published: false,
                created_by: userProfile.id,
                exam_type: newCourseExamType, // Save exam type
            },
        ]).select();

        if (error) console.error('Error creating course:', error);
        else {
            setNewCourseTitle('');
            setNewCourseDescription('');
            setNewCourseExamType('');
            fetchCourses();
            setSelectedCourse(data[0]); // Select newly created course
        }
    };

    const handlePublishToggle = async (courseId, currentStatus) => {
        if (!supabase) return;
        const { error } = await supabase
            .from('courses')
            .update({ published: !currentStatus })
            .eq('id', courseId);
        if (error) console.error('Error updating course status:', error);
        else fetchCourses();
    };

    const handleCreateModule = async (e) => {
        e.preventDefault();
        if (!newModuleName || !selectedCourse?.id || !supabase) return;

        const { data, error } = await supabase.from('modules').insert([
            {
                course_id: selectedCourse.id,
                title: newModuleName,
                order: 0, // Simplified ordering
            },
        ]).select();
        if (error) console.error('Error creating module:', error);
        else {
            setNewModuleName('');
            // Refresh selected course to show new module
            fetchCourseDetails(selectedCourse.id); // Re-fetch all details
        }
    };

    // This function will be passed to LessonCreationForm
    const handleAddNewLesson = (newLesson) => {
        // This callback is triggered when a lesson is successfully created in LessonCreationForm
        // We can use it to update the selectedCourse state to reflect the new lesson
        // For simplicity, we'll just re-fetch the entire course details
        fetchCourseDetails(selectedCourse.id);
    };


    const handleFileUpload = async (event, lessonId, type) => {
        const file = event.target.files[0];
        if (!file || !supabase) return;

        setUploading(true);
        setUploadMessage('Uploading...');
        const filePath = `${lessonId}/${Date.now()}-${file.name}`;
        const bucketName = type === 'video' ? 'course-videos' : 'course-documents';

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file);

        if (error) {
            console.error(`Error uploading ${type}:`, error);
            setUploadMessage(`Error uploading ${type}: ${error.message}`);
        } else {
            const publicUrl = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath).data.publicUrl;

            const updateField = type === 'video' ? 'video_url' : 'document_url';
            const { error: updateError } = await supabase
                .from('lessons')
                .update({ [updateField]: publicUrl })
                .eq('id', lessonId);

            if (updateError) {
                console.error('Error updating lesson with file URL:', updateError);
                setUploadMessage('File uploaded, but failed to link to lesson.');
            } else {
                setUploadMessage(`File uploaded and linked: ${publicUrl}`);
                fetchCourseDetails(selectedCourse.id); // Refresh course details
            }
        }
        setUploading(false);
    };

    const fetchCourseDetails = async (courseId) => {
        if (!supabase) return;
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('*, modules(*, lessons(*))')
            .eq('id', courseId)
            .order('order', { foreignTable: 'modules', ascending: true })
            .order('order', { foreignTable: 'modules.lessons', ascending: true })
            .single();

        if (courseError) {
            console.error('Error fetching course details:', courseError);
            setSelectedCourse(null);
        } else {
            setSelectedCourse(courseData);
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Admin Dashboard</h1>

            {/* Course Creation */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Create New Course</h2>
                <form onSubmit={handleCreateCourse} className="space-y-3 sm:space-y-4">
                    <div>
                        <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700">Course Title</label>
                        <input
                            type="text"
                            id="courseTitle"
                            name="courseTitle"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            placeholder="e.g., IELTS Preparation"
                            value={newCourseTitle}
                            onChange={(e) => setNewCourseTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="courseDescription" className="block text-sm font-medium text-gray-700">Course Description</label>
                        <textarea
                            id="courseDescription"
                            name="courseDescription"
                            rows="4"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            placeholder="Describe the course content, objectives, etc."
                            value={newCourseDescription}
                            onChange={(e) => setNewCourseDescription(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="courseExamType" className="block text-sm font-medium text-gray-700">Exam Type</label>
                        <select
                            id="courseExamType"
                            name="courseExamType"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={newCourseExamType}
                            onChange={(e) => setNewCourseExamType(e.target.value)}
                            required
                        >
                            <option value="">Select Exam Type</option>
                            {availableExams.map((exam) => (
                                <option key={exam} value={exam}>{exam}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-200 flex items-center space-x-2"
                    >
                        <PlusCircle size={20} />
                        <span>Create Course</span>
                    </button>
                </form>
            </div>

            {/* Existing Courses List */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Manage Existing Courses</h2>
                <ul className="space-y-3 sm:space-y-4">
                    {courses.map((course) => (
                        <li key={course.id} className="border border-gray-200 rounded-md p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50">
                            <div className="mb-2 sm:mb-0">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800">{course.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600">Status: {course.published ? 'Published' : 'Draft'}</p>
                                <p className="text-xs sm:text-sm text-gray-600">Exam: {course.exam_type || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                                <button
                                    onClick={() => handlePublishToggle(course.id, course.published)}
                                    className={`py-1 px-3 rounded-md text-white font-medium transition duration-200 w-full sm:w-auto ${
                                        course.published ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                >
                                    {course.published ? 'Unpublish' : 'Publish'}
                                </button>
                                <button
                                    onClick={() => fetchCourseDetails(course.id)}
                                    className="py-1 px-3 rounded-md bg-purple-500 hover:bg-purple-600 text-white font-medium transition duration-200 w-full sm:w-auto"
                                >
                                    Edit Content
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Course Content Editor (Modules & Lessons) */}
            {selectedCourse && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">
                        Editing Course: {selectedCourse.title}
                        <button
                            onClick={() => setSelectedCourse(null)}
                            className="ml-2 sm:ml-4 text-sm text-blue-500 hover:text-blue-700"
                        >
                            (Close Editor)
                        </button>
                    </h2>

                    {/* Add Module */}
                    <div className="border border-dashed border-gray-300 p-4 rounded-md mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2 sm:mb-3">Add New Module</h3>
                        <form onSubmit={handleCreateModule} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <input
                                type="text"
                                id={`newModuleName-${selectedCourse.id}`} // Added ID for accessibility
                                name={`newModuleName-${selectedCourse.id}`} // Added name for autofill/accessibility
                                className="flex-grow border border-gray-300 rounded-md p-2"
                                placeholder="Module Title (e.g., Speaking, Day 1)"
                                value={newModuleName}
                                onChange={(e) => setNewModuleName(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                            >
                                Add Module
                            </button>
                        </form>
                    </div>

                    {/* List Modules and Lessons */}
                    <div className="space-y-4 sm:space-y-6">
                        {selectedCourse.modules && selectedCourse.modules.map((module) => (
                            <div key={module.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">{module.title}</h3>

                                {/* Add Lesson Form (now a separate component) */}
                                <LessonCreationForm
                                    moduleId={module.id}
                                    onLessonCreate={handleAddNewLesson}
                                    fetchCourseDetails={() => fetchCourseDetails(selectedCourse.id)} // Pass callback to re-fetch course
                                />

                                {/* Lessons in Module */}
                                <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2">Lessons:</h4>
                                <ul className="space-y-2">
                                    {module.lessons && module.lessons.map((lesson) => (
                                        <li key={lesson.id} className="border border-gray-100 rounded-md p-3 bg-white">
                                            <p className="font-semibold text-gray-800">{lesson.title} ({lesson.type})</p>
                                            <p className="text-sm text-gray-600 truncate">{lesson.content}</p>
                                            {lesson.video_url && <p className="text-xs text-blue-500">Video: <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="underline">{lesson.video_url}</a></p>}
                                            {lesson.document_url && <p className="text-xs text-blue-500">Doc: <a href={lesson.document_url} target="_blank" rel="noopener noreferrer" className="underline">{lesson.document_url}</a></p>}

                                            <div className="mt-2 space-y-2">
                                                {/* These are for updating existing lessons with files */}
                                                <div>
                                                    <label htmlFor={`uploadVideo-${lesson.id}`} className="block text-sm font-medium text-gray-700">Upload Video (for this lesson):</label>
                                                    <input
                                                        type="file"
                                                        id={`uploadVideo-${lesson.id}`} // Added ID for accessibility
                                                        name={`uploadVideo-${lesson.id}`} // Added name for autofill/accessibility
                                                        accept="video/*"
                                                        onChange={(e) => handleFileUpload(e, lesson.id, 'video')}
                                                        disabled={uploading}
                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`uploadDocument-${lesson.id}`} className="block text-sm font-medium text-gray-700 mt-2">Upload Document (for this lesson):</label>
                                                    <input
                                                        type="file"
                                                        id={`uploadDocument-${lesson.id}`} // Added ID for accessibility
                                                        name={`uploadDocument-${lesson.id}`} // Added name for autofill/accessibility
                                                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                                                        onChange={(e) => handleFileUpload(e, lesson.id, 'document')}
                                                        disabled={uploading}
                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    />
                                                </div>
                                                {uploading && <p className="text-blue-600 text-sm mt-1">{uploadMessage}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Student Dashboard
const StudentDashboard = ({ setCurrentPage, setSelectedCourseId }) => {
    const { supabase, userProfile } = useContext(AppContext);
    const [allPublishedCourses, setAllPublishedCourses] = useState([]); // All published courses
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingCourses, setLoadingCourses] = useState(true);

    // Fetch all published courses once on component mount or supabase client change
    useEffect(() => {
        const fetchAllPublishedCourses = async () => {
            setLoadingCourses(true);
            if (!supabase) {
                console.log('Supabase client not ready for fetching all published courses.');
                setLoadingCourses(false);
                return;
            }
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('published', true);
            if (error) console.error('Error fetching all published courses:', error);
            else setAllPublishedCourses(data);
            setLoadingCourses(false);
        };
        fetchAllPublishedCourses();
    }, [supabase]);

    // Filter and set enrolled courses when userProfile or allPublishedCourses change
    useEffect(() => {
        const filterAndSetCourses = async () => {
            if (!supabase || !userProfile?.id || !allPublishedCourses.length) {
                console.log('Skipping filterAndSetCourses: Supabase, userProfile, or allPublishedCourses not ready.');
                setEnrolledCourses([]); // Clear enrolled courses if prerequisites aren't met
                return;
            }

            console.log('User Profile Registered Exams:', userProfile.registered_exams);
            console.log('All Published Courses:', allPublishedCourses);

            // Fetch actual enrollments for the student
            const { data, error } = await supabase
                .from('enrollments')
                .select('course_id') // Only need course_ids for enrolled courses
                .eq('student_id', userProfile.id);

            if (error) {
                console.error('Error fetching enrolled course IDs:', error);
                setEnrolledCourses([]);
                return;
            }
            const enrolledCourseIds = new Set(data.map(e => e.course_id));
            console.log('Enrolled Course IDs from DB:', Array.from(enrolledCourseIds));

            // Filter all published courses by registered exams AND enrollment status
            const filteredAndEnrolled = allPublishedCourses.filter(course => {
                const matchesExamType = userProfile.registered_exams && userProfile.registered_exams.includes(course.exam_type);
                const isEnrolled = enrolledCourseIds.has(course.id);
                console.log(`Course: ${course.title}, Exam Type: ${course.exam_type}, Matches User Exams: ${matchesExamType}, Is Enrolled: ${isEnrolled}`);
                return matchesExamType && isEnrolled;
            });
            setEnrolledCourses(filteredAndEnrolled);
        };

        // Only run if userProfile is available and courses are loaded
        if (userProfile && !loadingCourses) {
            filterAndSetCourses();
        }
    }, [userProfile, allPublishedCourses, supabase, loadingCourses]); // Depend on userProfile, allPublishedCourses, supabase, and loadingCourses

    // Filter available courses (not enrolled, and matches registered exams)
    const filteredAvailableCourses = allPublishedCourses.filter(course =>
        userProfile?.registered_exams?.includes(course.exam_type) && // Ensure user has registered for this exam type
        !enrolledCourses.some(enrolled => enrolled.id === course.id) && // Not already enrolled
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEnroll = async (courseId) => {
        if (!userProfile?.id || !supabase) {
            alert('Please log in to enroll.');
            return;
        }
        const { error } = await supabase.from('enrollments').insert([
            {
                student_id: userProfile.id,
                course_id: courseId,
            },
        ]);
        if (error) {
            console.error('Error enrolling:', error);
            alert('Failed to enroll. You might already be enrolled.');
        } else {
            alert('Enrolled successfully!');
            // Re-fetch all data to ensure enrolled courses are updated
            // This will trigger the filterAndSetCourses useEffect
            setLoadingCourses(true); // Indicate loading while data refreshes
            if (supabase) {
                const { data, error: fetchError } = await supabase
                    .from('courses')
                    .select('*')
                    .eq('published', true);
                if (fetchError) console.error('Error re-fetching all published courses after enrollment:', fetchError);
                else setAllPublishedCourses(data);
                setLoadingCourses(false);
            }
        }
    };

    const handleViewCourse = (courseId) => {
        setSelectedCourseId(courseId);
        setCurrentPage('courseView');
    };

    if (loadingCourses) return <div className="p-4 sm:p-6 text-center">Loading courses...</div>;

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Student Dashboard</h1>

            {/* Enrolled Courses */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Your Enrolled Courses</h2>
                {enrolledCourses.length === 0 ? (
                    <p className="text-gray-600 text-sm sm:text-base">You are not enrolled in any courses yet or no courses match your registered exams. Discover new courses below!</p>
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {enrolledCourses.map((course) => (
                            <li key={course.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-2">{course.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Exam Type: {course.exam_type || 'N/A'}</p>
                                <div className="text-gray-700 text-sm mb-3 line-clamp-3" dangerouslySetInnerHTML={{ __html: course.description }} />
                                <button
                                    onClick={() => handleViewCourse(course.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 w-full flex items-center justify-center space-x-2"
                                >
                                    <BookOpen size={20} />
                                    <span>View Course</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Course Discovery */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Discover Courses</h2>
                <div className="mb-4 flex items-center border border-gray-300 rounded-md shadow-sm p-2">
                    <Search size={20} className="text-gray-500 mr-2" />
                    <input
                        type="text"
                        id="courseSearch" // Added ID for accessibility
                        name="courseSearch" // Added name for autofill/accessibility
                        placeholder="Search courses (IELTS, PTE, SAT, etc.)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-grow outline-none text-gray-700"
                    />
                </div>
                {filteredAvailableCourses.length === 0 ? (
                    <p className="text-gray-600 text-sm sm:text-base">No new courses available matching your search or registered exams.</p>
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAvailableCourses.map((course) => (
                            <li key={course.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Exam Type: {course.exam_type || 'N/A'}</p>
                                <div className="text-gray-700 text-sm mb-3 line-clamp-3" dangerouslySetInnerHTML={{ __html: course.description }} />
                                <button
                                    onClick={() => handleEnroll(course.id)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 w-full flex items-center justify-center space-x-2"
                                >
                                    <PlusCircle size={20} />
                                    <span>Enroll Now</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

// Course View Page (Student)
const CourseView = ({ courseId, setCurrentPage }) => {
    const { supabase, userProfile } = useContext(AppContext);
    const [course, setCourse] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState({}); // { lesson_id: completed_status }
    const [videoLoadError, setVideoLoadError] = useState(false); // New state for video load errors

    // Helper to extract YouTube video ID
    const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    useEffect(() => {
        // Reset videoLoadError when selectedLesson or courseId changes
        setVideoLoadError(false); 
        if (courseId && userProfile?.id && supabase) { // Ensure all dependencies are available
            fetchCourseDetails();
            fetchStudentProgress();
        }
    }, [courseId, userProfile, supabase, selectedLesson]); // Depend on supabase client and selectedLesson

    const fetchCourseDetails = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('*, modules(*, lessons(*))')
            .eq('id', courseId)
            .order('order', { foreignTable: 'modules', ascending: true })
            .order('order', { foreignTable: 'modules.lessons', ascending: true })
            .single();

        if (courseError) {
            console.error('Error fetching course:', courseError);
            alert('Course not found or access denied.');
            setCurrentPage('studentDashboard');
            setLoading(false);
            return;
        }
        setCourse(courseData);

        // Set the first lesson as selected by default if available
        if (courseData.modules && courseData.modules.length > 0 && courseData.modules[0].lessons && courseData.modules[0].lessons.length > 0) {
            setSelectedLesson(courseData.modules[0].lessons[0]);
        }
        setLoading(false);
    };

    const fetchStudentProgress = async () => {
        if (!supabase || !userProfile?.id) return;
        const { data, error } = await supabase
            .from('progress')
            .select('*')
            .eq('student_id', userProfile.id)
            .eq('course_id', courseId); // Filter by course_id for efficiency

        if (error) {
            console.error('Error fetching progress:', error);
            return;
        }
        const progressMap = data.reduce((acc, item) => {
            acc[item.lesson_id] = item.completed;
            return acc;
        }, {});
        setProgress(progressMap);
    };

    const handleLessonCompleteToggle = async (lessonId, currentStatus) => {
        if (!supabase || !userProfile?.id) return;
        const { error } = await supabase.from('progress').upsert(
            {
                student_id: userProfile.id,
                course_id: courseId, // Store course_id for easier querying
                lesson_id: lessonId,
                completed: !currentStatus,
                last_viewed_at: new Date().toISOString(),
            },
            { onConflict: ['student_id', 'lesson_id'] } // Update if already exists
        );
        if (error) console.error('Error updating progress:', error);
        else fetchStudentProgress(); // Refresh progress
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Failed to download file.');
        }
    };

    if (loading) return <div className="p-4 sm:p-6 text-center">Loading course content...</div>;
    if (!course) return <div className="p-4 sm:p-6 text-center text-red-600">Course not found or access denied.</div>;

    const youtubeVideoId = selectedLesson?.video_url ? getYouTubeVideoId(selectedLesson.video_url) : null;

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Course: {course.title}</h1>
            <button
                onClick={() => setCurrentPage('studentDashboard')}
                className="mb-4 sm:mb-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200"
            >
                Back to Dashboard
            </button>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Modules & Lessons Sidebar */}
                <div className="lg:w-1/4 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Course Content</h2>
                    <nav className="space-y-3 sm:space-y-4">
                        {course.modules && course.modules.map((module) => (
                            <div key={module.id}>
                                <h3 className="text-lg sm:text-xl font-bold text-blue-700 mb-1 sm:mb-2">{module.title}</h3>
                                <ul className="space-y-1 sm:space-y-2 pl-3 sm:pl-4">
                                    {module.lessons && module.lessons.map((lesson) => (
                                        <li
                                            key={lesson.id}
                                            onClick={() => setSelectedLesson(lesson)}
                                            className={`cursor-pointer p-2 rounded-md transition-colors flex items-center space-x-2
                                                ${selectedLesson?.id === lesson.id ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100 text-gray-700'}
                                                ${progress[lesson.id] ? 'text-green-700' : ''}
                                            `}
                                        >
                                            {progress[lesson.id] && <CheckCircle size={16} className="text-green-500" />}
                                            <span className="text-sm sm:text-base">{lesson.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Lesson Content Area */}
                <div className="lg:w-3/4 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                    {selectedLesson ? (
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">{selectedLesson.title}</h2>
                            {selectedLesson.video_url && (
                                <div className="mb-4 aspect-video bg-black rounded-lg overflow-hidden">
                                    {videoLoadError ? (
                                        <div className="flex items-center justify-center h-full text-white text-center p-4 bg-red-800">
                                            <p>
                                                Error loading video. It might be due to embedding restrictions (for YouTube) or an inaccessible file (for direct links).
                                                Please try a different video URL or upload the video directly via the Admin Dashboard.
                                            </p>
                                        </div>
                                    ) : youtubeVideoId ? (
                                        <iframe
                                            className="w-full h-full"
                                            src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            onError={() => {
                                                console.error("YouTube iframe failed to load.");
                                                setVideoLoadError(true);
                                            }}
                                        ></iframe>
                                    ) : (
                                        <video
                                            controls
                                            className="w-full h-full"
                                            onError={() => {
                                                console.error("Video tag failed to load.");
                                                setVideoLoadError(true);
                                            }}
                                        >
                                            <source src={selectedLesson.video_url} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            )}
                            <div className="prose max-w-none mb-4 sm:mb-6 text-gray-700 text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                            {selectedLesson.document_url && (
                                <button
                                    onClick={() => handleDownload(selectedLesson.document_url, `${selectedLesson.title}.pdf`)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center space-x-2 mb-4"
                                >
                                    <Download size={20} />
                                    <span>Download Document</span>
                                </button>
                            )}
                            <button
                                onClick={() => handleLessonCompleteToggle(selectedLesson.id, progress[selectedLesson.id])}
                                className={`py-2 px-4 rounded-md font-bold transition duration-200 flex items-center space-x-2 ${
                                    progress[selectedLesson.id] ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                            >
                                <CheckCircle size={20} />
                                <span>{progress[selectedLesson.id] ? 'Mark as Incomplete' : 'Mark as Complete'}</span>
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center py-6 sm:py-10 text-sm sm:text-base">Select a lesson from the left to view its content.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Profile Page
const ProfilePage = ({ setCurrentPage }) => {
    const { supabase, userProfile, setUserProfile } = useContext(AppContext);
    const [name, setName] = useState(userProfile?.name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
        }
    }, [userProfile]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!supabase || !userProfile?.id) {
            setMessage('Supabase client or user profile not available.');
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ name: name })
            .eq('id', userProfile.id);

        if (error) {
            setMessage(`Error updating profile: ${error.message}`);
        } else {
            setUserProfile({ ...userProfile, name: name }); // Update context
            setMessage('Profile updated successfully!');
        }
        setLoading(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!supabase) {
            setMessage('Supabase client not initialized. Please wait or refresh.');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setMessage('Passwords do not match.');
            setLoading(false);
            return;
        }
        if (newPassword.length < 6) {
            setMessage('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage(`Error changing password: ${error.message}`);
        } else {
            setMessage('Password changed successfully!');
            setNewPassword('');
            setConfirmNewPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Your Profile</h1>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Edit Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4">
                    <div>
                        <label htmlFor="profileName" className="block text-gray-700 text-sm font-bold mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            id="profileName" // Added ID for accessibility
                            name="profileName" // Added name for autofill/accessibility
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <p className="text-gray-600 p-2 border rounded bg-gray-100">{userProfile?.email}</p>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            id="newPassword" // Added ID for accessibility
                            name="newPassword" // Added name for autofill/accessibility
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmNewPassword" className="block text-gray-700 text-sm font-bold mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            id="confirmNewPassword" // Added ID for accessibility
                            name="confirmNewPassword" // Added name for autofill/accessibility
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                        disabled={loading}
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
            {message && (
                <div className="mt-4 p-3 bg-blue-100 text-blue-700 rounded text-center">
                        {message}
                </div>
            )}
        </div>
    );
};


// Main App Component
export default function App() {
    const { currentPage, setCurrentPage } = useNavigation();
    // Removed direct useContext here, as AppProvider will wrap this component

    const [selectedCourseId, setSelectedCourseId] = useState(null); // For CourseView

    // The script loading logic is now handled within AppProvider

    // This is the actual content that will be rendered inside AppProvider
    const AppContent = () => {
        const { session, userProfile, loading } = useContext(AppContext); // Now useContext is called within the child of AppProvider

        if (loading) { // This loading now includes waiting for supabaseClient and scripts
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="text-xl font-semibold text-gray-700">Loading application...</div>
                </div>
            );
        }

        let content;
        if (!session) {
            content = <AuthPage setCurrentPage={setCurrentPage} />;
        } else if (userProfile?.role === 'admin') {
            switch (currentPage) {
                case 'adminDashboard':
                case 'home': // Home for admin also goes to admin dashboard
                    content = <AdminDashboard setCurrentPage={setCurrentPage} />;
                    break;
                case 'profile':
                    content = <ProfilePage setCurrentPage={setCurrentPage} />;
                    break;
                default:
                    content = <AdminDashboard setCurrentPage={setCurrentPage} />;
                    break;
            }
        } else { // Student or default
            switch (currentPage) {
                case 'studentDashboard':
                case 'home': // Home for student also goes to student dashboard
                    content = <StudentDashboard setCurrentPage={setCurrentPage} setSelectedCourseId={setSelectedCourseId} />;
                    break;
                case 'courseView':
                    content = <CourseView courseId={selectedCourseId} setCurrentPage={setCurrentPage} />;
                    break;
                case 'profile':
                    content = <ProfilePage setCurrentPage={setCurrentPage} />;
                    break;
                default:
                    content = <StudentDashboard setCurrentPage={setCurrentPage} setSelectedCourseId={setSelectedCourseId} />;
                    break;
            }
        }

        return (
            <div className="font-sans antialiased bg-gray-100">
                {session && <Header setCurrentPage={setCurrentPage} />}
                {content}
            </div>
        );
    };

    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
