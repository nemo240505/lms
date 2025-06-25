import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, 
  signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider
} from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, query, where, getDocs, getDoc } from 'firebase/firestore';

// Global variables for Firebase configuration provided by the Canvas environment
// These are accessed safely to avoid 'not defined' errors in local environments.
const defaultFirebaseConfig = {
  apiKey: "AIzaSyBDAFhhl9QaKdL_jYZyU_kFynDEp7p0aGg",
  authDomain: "eagc-bdd12.firebaseapp.com",
  databaseURL: "https://eagc-bdd12-default-rtdb.firebaseio.com",
  projectId: "eagc-bdd12",
  storageBucket: "eagc-bdd12.firebasestorage.app",
  messagingSenderId: "665706614718",
  appId: "1:665706614718:web:23adcfdfc9a42e840233ef"
};

const firebaseConfig = typeof window !== 'undefined' && typeof window.__firebase_config !== 'undefined'
  ? JSON.parse(window.__firebase_config)
  : defaultFirebaseConfig;

const appId = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : firebaseConfig.projectId;
const initialAuthToken = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

// --- Placeholder Data ---
// Ensure all data points have 'category', 'module', and 'day' properties
const placeholderVideos = [
  // IELTS Listening (8 days)
  { id: 'v1_ielts_listening_d1', title: 'IELTS Listening - Day 1 Intro', description: 'Understanding the test format.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', category: 'IELTS', module: 'Listening', day: 'Day 1' },
  { id: 'v2_ielts_listening_d1_p', title: 'IELTS Listening - Day 1 Practice', description: 'First practice set.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', category: 'IELTS', module: 'Listening', day: 'Day 1' },
  { id: 'v3_ielts_listening_d2', title: 'IELTS Listening - Day 2 Section 1', description: 'Focus on Section 1 questions.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', category: 'IELTS', module: 'Listening', day: 'Day 2' },
  { id: 'v4_ielts_listening_d2_p', title: 'IELTS Listening - Day 2 Section 2', description: 'Focus on Section 2 questions.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', category: 'IELTS', module: 'Listening', day: 'Day 2' },
  { id: 'v5_ielts_listening_d3', title: 'IELTS Listening - Day 3 Section 3', description: 'Strategies for conversations.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', category: 'IELTS', module: 'Listening', day: 'Day 3' },
  { id: 'v6_ielts_listening_d4', title: 'IELTS Listening - Day 4 Section 4', description: 'Lectures and monologues.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', category: 'IELTS', module: 'Listening', day: 'Day 4' },
  { id: 'v7_ielts_listening_d5', title: 'IELTS Listening - Day 5 Map Labelling', description: 'Mastering map and plan questions.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', category: 'IELTS', module: 'Listening', day: 'Day 5' },
  { id: 'v8_ielts_listening_d6', title: 'IELTS Listening - Day 6 Form Completion', description: 'Techniques for form filling.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', category: 'IELTS', module: 'Listening', day: 'Day 6' },
  { id: 'v9_ielts_listening_d7', title: 'IELTS Listening - Day 7 Multiple Choice', description: 'Handling multi-choice questions.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', category: 'IELTS', module: 'Listening', day: 'Day 7' },
  { id: 'v10_ielts_listening_d8', title: 'IELTS Listening - Day 8 Full Test', description: 'Simulated full listening test.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', category: 'IELTS', module: 'Listening', day: 'Day 8' },
  
  // IELTS Reading (3 days)
  { id: 'v11_ielts_reading_d1', title: 'IELTS Reading - Day 1 Intro', description: 'Reading Strategies Overview.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', category: 'IELTS', module: 'Reading', day: 'Day 1' },
  { id: 'v12_ielts_reading_d1_p', title: 'IELTS Reading - Day 1 Skimming & Scanning', description: 'Techniques for quick comprehension.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', category: 'IELTS', module: 'Reading', day: 'Day 1' },
  { id: 'v13_ielts_reading_d2', title: 'IELTS Reading - Day 2 Heading Matching', description: 'Matching headings to paragraphs.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', category: 'IELTS', module: 'Reading', day: 'Day 2' },
  { id: 'v14_ielts_reading_d3', title: 'IELTS Reading - Day 3 True/False/Not Given', description: 'Strategies for detail questions.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', category: 'IELTS', module: 'Reading', day: 'Day 3' },
  
  // IELTS Writing (3 days)
  { id: 'v15_ielts_writing_d1', title: 'IELTS Writing - Day 1 Intro', description: 'Task 1 & Task 2 Overview.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', category: 'IELTS', module: 'Writing', day: 'Day 1' },
  { id: 'v16_ielts_writing_d1_t1', title: 'IELTS Writing - Day 1 Task 1 Report Writing', description: 'Analyzing charts and graphs.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', category: 'IELTS', module: 'Writing', day: 'Day 1' },
  { id: 'v17_ielts_writing_d2', title: 'IELTS Writing - Day 2 Task 2 Essay Structure', description: 'Structuring your argumentative essay.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', category: 'IELTS', module: 'Writing', day: 'Day 2' },
  { id: 'v18_ielts_writing_d3', title: 'IELTS Writing - Day 3 Cohesion & Coherence', description: 'Linking ideas effectively.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', category: 'IELTS', module: 'Writing', day: 'Day 3' },

  // IELTS Speaking (3 days)
  { id: 'v19_ielts_speaking_d1', title: 'IELTS Speaking - Day 1 Intro', description: 'Parts 1, 2, & 3 explained.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', category: 'IELTS', module: 'Speaking', day: 'Day 1' },
  { id: 'v20_ielts_speaking_d1_p1', title: 'IELTS Speaking - Day 1 Part 1 Practice', description: 'Common introductory topics.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', category: 'IELTS', module: 'Speaking', day: 'Day 1' },
  { id: 'v21_ielts_speaking_d2', title: 'IELTS Speaking - Day 2 Part 2 Cue Card', description: 'Developing a 2-minute talk.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', category: 'IELTS', module: 'Speaking', day: 'Day 2' },
  { id: 'v22_ielts_speaking_d3', title: 'IELTS Speaking - Day 3 Part 3 Discussion', description: 'Deep dive into abstract topics.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', category: 'IELTS', module: 'Speaking', day: 'Day 3' },

  // PTE Videos (2 days per module)
  { id: 'v23_pt_speaking_d1', title: 'PTE Speaking - Day 1 Read Aloud', description: 'Mastering pronunciation and fluency.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', category: 'PT', module: 'Speaking', day: 'Day 1' },
  { id: 'v24_pt_speaking_d2', title: 'PTE Speaking - Day 2 Repeat Sentence', description: 'Techniques for accuracy.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', category: 'PT', module: 'Speaking', day: 'Day 2' },
  { id: 'v25_pt_writing_d1', title: 'PTE Writing - Day 1 Summarize Written Text', description: 'Identifying key points.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', category: 'PT', module: 'Writing', day: 'Day 1' },
  { id: 'v26_pt_writing_d2', title: 'PTE Writing - Day 2 Essay Writing', description: 'Structure and argument development.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', category: 'PT', module: 'Writing', day: 'Day 2' },
  { id: 'v27_pt_reading_d1', title: 'PTE Reading - Day 1 Fill in the Blanks', description: 'Vocabulary and grammar focus.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', category: 'PT', module: 'Reading', day: 'Day 1' },
  { id: 'v28_pt_reading_d2', title: 'PTE Reading - Day 2 Re-order Paragraphs', description: 'Cohesion and coherence practice.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', category: 'PT', module: 'Reading', day: 'Day 2' },
  { id: 'v29_pt_listening_d1', title: 'PTE Listening - Day 1 Summarize Spoken Text', description: 'Note-taking strategies.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', category: 'PT', module: 'Listening', day: 'Day 1' },
  { id: 'v30_pt_listening_d2', title: 'PTE Listening - Day 2 Multiple Choice', description: 'Selecting correct options.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', category: 'PT', module: 'Listening', day: 'Day 2' },

  // SAT Videos (2 days per module)
  { id: 'v31_sat_math_d1', title: 'SAT Math - Day 1 Algebra', description: 'Linear equations and inequalities.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', category: 'SAT', module: 'Math', day: 'Day 1' },
  { id: 'v32_sat_math_d2', title: 'SAT Math - Day 2 Geometry', description: 'Area, volume, and angles.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', category: 'SAT', module: 'Math', day: 'Day 2' },
  { id: 'v33_sat_reading_d1', title: 'SAT Reading - Day 1 Command of Evidence', description: 'Finding textual evidence.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', category: 'SAT', module: 'Reading', day: 'Day 1' },
  { id: 'v34_sat_reading_d2', title: 'SAT Reading - Day 2 Main Idea Questions', description: 'Identifying central themes.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', category: 'SAT', module: 'Reading', day: 'Day 2' },
  { id: 'v35_sat_writing_d1', title: 'SAT Writing - Day 1 Standard English', description: 'Grammar and usage rules.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', category: 'SAT', module: 'Writing', day: 'Day 1' },
  { id: 'v36_sat_writing_d2', title: 'SAT Writing - Day 2 Expression of Ideas', description: 'Conciseness and effectiveness.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', category: 'SAT', module: 'Writing', day: 'Day 2' },
];

const sampleQuizzes = [
  // IELTS Listening (8 days)
  { id: 'q1_ielts_listening_d1', title: 'Listening Day 1 Quiz', description: 'Basic listening comprehension.', category: 'IELTS', module: 'Listening', day: 'Day 1', questions: [{ questionText: 'What is the capital of France?', options: ['Berlin', 'Paris', 'Rome', 'Madrid'], correctAnswer: 'Paris' }] },
  { id: 'q2_ielts_listening_d2', title: 'Listening Day 2 Quiz', description: 'Section 1 & 2 practice.', category: 'IELTS', module: 'Listening', day: 'Day 2', questions: [{ questionText: 'How many days in a week?', options: ['5', '6', '7', '8'], correctAnswer: '7' }] },
  { id: 'q3_ielts_listening_d3', title: 'Listening Day 3 Quiz', description: 'Conversations focus.', category: 'IELTS', module: 'Listening', day: 'Day 3', questions: [{ questionText: 'What color is the sky?', options: ['Green', 'Blue', 'Red', 'Yellow'], correctAnswer: 'Blue' }] },
  { id: 'q4_ielts_listening_d4', title: 'Listening Day 4 Quiz', description: 'Lectures and monologues.', category: 'IELTS', module: 'Listening', day: 'Day 4', questions: [{ questionText: '2 + 2 = ?', options: ['3', '4', '5', '6'], correctAnswer: '4' }] },
  { id: 'q5_ielts_listening_d5', title: 'Listening Day 5 Quiz', description: 'Map labelling quiz.', category: 'IELTS', module: 'Listening', day: 'Day 5', questions: [{ questionText: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 'Pacific' }] },
  { id: 'q6_ielts_listening_d6', title: 'Listening Day 6 Quiz', description: 'Form completion quiz.', category: 'IELTS', module: 'Listening', day: 'Day 6', questions: [{ questionText: 'Which animal lays eggs?', options: ['Dog', 'Cat', 'Chicken', 'Cow'], correctAnswer: 'Chicken' }] },
  { id: 'q7_ielts_listening_d7', title: 'Listening Day 7 Quiz', description: 'Multiple choice questions.', category: 'IELTS', module: 'Listening', day: 'Day 7', questions: [{ questionText: 'What is the opposite of hot?', options: ['Warm', 'Cold', 'Big', 'Small'], correctAnswer: 'Cold' }] },
  { id: 'q8_ielts_listening_d8', title: 'Listening Day 8 Full Test.', description: 'Final listening test.', category: 'IELTS', module: 'Listening', day: 'Day 8', questions: [{ questionText: 'How many legs does a spider have?', options: ['4', '6', '8', '10'], correctAnswer: '8' }] },

  // IELTS Reading (3 days)
  { id: 'q9_ielts_reading_d1', title: 'Reading Day 1 Quiz', description: 'Skimming and scanning.', category: 'IELTS', module: 'Reading', day: 'Day 1', questions: [{ questionText: 'What is main idea of passage?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A' }] },
  { id: 'q10_ielts_reading_d2', title: 'Reading Day 2 Quiz', description: 'Heading matching.', category: 'IELTS', module: 'Reading', day: 'Day 2', questions: [{ questionText: 'Which paragraph matches heading?', options: ['1', '2', '3', '4'], correctAnswer: '2' }] },
  { id: 'q11_ielts_reading_d3', title: 'Reading Day 3 Quiz', description: 'True/False/Not Given.', category: 'IELTS', module: 'Reading', day: 'Day 3', questions: [{ questionText: 'Is statement true?', options: ['True', 'False', 'Not Given'], correctAnswer: 'True' }] },

  // IELTS Writing (3 days)
  { id: 'q12_ielts_writing_d1', title: 'Writing Day 1 Quiz', description: 'Task 1 data analysis.', category: 'IELTS', module: 'Writing', day: 'Day 1', questions: [{ questionText: 'What is highest value?', options: ['10', '20', '30', '40'], correctAnswer: '30' }] },
  { id: 'q13_ielts_writing_d2', title: 'Writing Day 2 Quiz', description: 'Task 2 essay structure.', category: 'IELTS', module: 'Writing', day: 'Day 2', questions: [{ questionText: 'How many paragraphs for body?', options: ['1', '2', '3', '4'], correctAnswer: '3' }] },
  { id: 'q14_ielts_writing_d3', title: 'Writing Day 3 Quiz', description: 'Coherence and linking.', category: 'IELTS', module: 'Writing', day: 'Day 3', questions: [{ questionText: 'Best transition word?', options: ['But', 'However', 'And', 'Or'], correctAnswer: 'However' }] },

  // IELTS Speaking (3 days)
  { id: 'q15_ielts_speaking_d1', title: 'Speaking Day 1 Quiz', description: 'Part 1 intro topics.', category: 'IELTS', module: 'Speaking', day: 'Day 1', questions: [{ questionText: 'Describe your hometown.', options: ['Good', 'Average', 'Poor'], correctAnswer: 'Good' }] },
  { id: 'q16_ielts_speaking_d2', title: 'Speaking Day 2 Quiz', description: 'Part 2 cue card ideas.', category: 'IELTS', module: 'Speaking', day: 'Day 2', questions: [{ questionText: 'Plan a talk on a book.', options: ['Easy', 'Hard'], correctAnswer: 'Easy' }] },
  { id: 'q17_ielts_speaking_d3', title: 'Speaking Day 3 Quiz', description: 'Part 3 discussion depth.', category: 'IELTS', module: 'Speaking', day: 'Day 3', questions: [{ questionText: 'Impact of technology?', options: ['Positive', 'Negative', 'Both'], correctAnswer: 'Both' }] },

  // PTE Quizzes (2 days per module)
  { id: 'q18_pt_speaking_d1', title: 'PTE Speaking Day 1 Quiz', description: 'Read Aloud practice.', category: 'PT', module: 'Speaking', day: 'Day 1', questions: [{ questionText: 'Is sentence correctly read?', options: ['Yes', 'No'], correctAnswer: 'Yes' }] },
  { id: 'q19_pt_speaking_d2', title: 'PTE Speaking Day 2 Quiz', description: 'Repeat Sentence accuracy.', category: 'PT', module: 'Speaking', day: 'Day 2', questions: [{ questionText: 'Did you repeat correctly?', options: ['Yes', 'No'], correctAnswer: 'Yes' }] },
  { id: 'q20_pt_writing_d1', title: 'PTE Writing Day 1 Quiz', description: 'Summarize Written Text.', category: 'PT', module: 'Writing', day: 'Day 1', questions: [{ questionText: 'Is summary accurate?', options: ['Yes', 'No'], correctAnswer: 'Yes' }] },
  { id: 'q21_pt_writing_d2', title: 'PTE Writing Day 2 Quiz', description: 'Essay coherence.', category: 'PT', module: 'Writing', day: 'Day 2', questions: [{ questionText: 'Is essay well-structured?', options: ['Yes', 'No'], correctAnswer: 'Yes' }] },
  { id: 'q22_pt_reading_d1', title: 'PTE Reading Day 1 Quiz', description: 'Fill in the blanks.', category: 'PT', module: 'Reading', day: 'Day 1', questions: [{ questionText: 'Correct word for blank?', options: ['Option A', 'Option B'], correctAnswer: 'Option A' }] },
  { id: 'q23_pt_reading_d2', title: 'PTE Reading Day 2 Quiz', description: 'Re-order paragraphs.', category: 'PT', module: 'Reading', day: 'Day 2', questions: [{ questionText: 'Are paragraphs in order?', options: ['Yes', 'No'], correctAnswer: 'Yes' }] },
  { id: 'q24_pt_listening_d1', title: 'PTE Listening Day 1 Quiz', description: 'Summarize Spoken Text.', category: 'PT', module: 'Listening', day: 'Day 1', questions: [{ questionText: 'Is summary complete?', options: ['Yes', 'No'], correctAnswer: 'Yes' }] },
  { id: 'q25_pt_listening_d2', title: 'PTE Listening Day 2 Quiz', description: 'Multiple Choice.', category: 'PT', module: 'Listening', day: 'Day 2', questions: [{ questionText: 'Correct answer to audio?', options: ['Option A', 'Option B'], correctAnswer: 'Option A' }] },

  // SAT Quizzes (2 days per module)
  { id: 'q26_sat_math_d1', title: 'SAT Math Day 1 Quiz', description: 'Algebraic equations.', category: 'SAT', module: 'Math', day: 'Day 1', questions: [{ questionText: 'If x+2=5, what is x?', options: ['1', '2', '3', '4'], correctAnswer: '3' }] },
  { id: 'q27_sat_math_d2', title: 'SAT Math Day 2 Quiz', description: 'Geometry fundamentals.', category: 'SAT', module: 'Math', day: 'Day 2', questions: [{ questionText: 'Area of square with side 4?', options: ['8', '16', '32'], correctAnswer: '16' }] },
  { id: 'q28_sat_reading_d1', title: 'SAT Reading Day 1 Quiz', description: 'Evidence-based reading.', category: 'SAT', module: 'Reading', day: 'Day 1', questions: [{ questionText: 'Line number supporting claim?', options: ['5', '10', '15'], correctAnswer: '10' }] },
  { id: 'q29_sat_reading_d2', title: 'SAT Reading Day 2 Quiz', description: 'Main idea inference.', category: 'SAT', module: 'Reading', day: 'Day 2', questions: [{ questionText: 'Best title for passage?', options: ['A', 'B', 'C'], correctAnswer: 'A' }] },
  { id: 'q30_sat_writing_d1', title: 'SAT Writing Day 1 Quiz', description: 'Grammar and usage.', category: 'SAT', module: 'Writing', day: 'Day 1', questions: [{ questionText: 'Correct punctuation?', options: [',', ';', '.'], correctAnswer: '.' }] },
  { id: 'q31_sat_writing_d2', title: 'SAT Writing Day 2 Quiz', description: 'Sentence structure.', category: 'SAT', module: 'Writing', day: 'Day 2', questions: [{ questionText: 'Which sentence is concise?', options: ['Long', 'Medium', 'Short'], correctAnswer: 'Short' }] },
];

const placeholderAssignments = [
  // IELTS Listening (8 days)
  { id: 'a1_ielts_listening_d1', title: 'Listening Day 1 Assignment', description: 'Transcribe a short audio clip.', category: 'IELTS', module: 'Listening', day: 'Day 1' },
  { id: 'a2_ielts_listening_d2', title: 'Listening Day 2 Assignment', description: 'Summarize Section 1 & 2 content.', category: 'IELTS', module: 'Listening', day: 'Day 2' },
  { id: 'a3_ielts_listening_d3', title: 'Listening Day 3 Assignment', description: 'Identify speaker opinions from a conversation.', category: 'IELTS', module: 'Listening', day: 'Day 3' },
  { id: 'a4_ielts_listening_d4', title: 'Listening Day 4 Assignment', description: 'Note-taking practice from a lecture.', category: 'IELTS', module: 'Listening', day: 'Day 4' },
  { id: 'a5_ielts_listening_d5', title: 'Listening Day 5 Assignment', description: 'Draw a map based on audio instructions.', category: 'IELTS', module: 'Listening', day: 'Day 5' },
  { id: 'a6_ielts_listening_d6', title: 'Listening Day 6 Assignment', description: 'Complete a personal information form.', category: 'IELTS', module: 'Listening', day: 'Day 6' },
  { id: 'a7_ielts_listening_d7', title: 'Listening Day 7 Assignment', description: 'Analyze distractors in multiple-choice questions.', category: 'IELTS', module: 'Listening', day: 'Day 7' },
  { id: 'a8_ielts_listening_d8', title: 'Listening Day 8 Assignment', description: 'Review common listening challenges and solutions.', category: 'IELTS', module: 'Listening', day: 'Day 8' },

  // IELTS Reading (3 days)
  { id: 'a9_ielts_reading_d1', title: 'Reading Day 1 Assignment', description: 'Practice paragraph matching.', category: 'IELTS', module: 'Reading', day: 'Day 1' },
  { id: 'a10_ielts_reading_d2', title: 'Reading Day 2 Assignment', description: 'Sentence completion task.', category: 'IELTS', module: 'Reading', day: 'Day 2' },
  { id: 'a11_ielts_reading_d3', title: 'Reading Day 3 Assignment', description: 'Summary completion.', category: 'IELTS', module: 'Reading', day: 'Day 3' },

  // IELTS Writing (3 days)
  { id: 'a12_ielts_writing_d1', title: 'Writing Day 1 Assignment', description: 'Describe a bar chart.', category: 'IELTS', module: 'Writing', day: 'Day 1' },
  { id: 'a13_ielts_writing_d2', title: 'Writing Day 2 Assignment', description: 'Write an opinion essay.', category: 'IELTS', module: 'Writing', day: 'Day 2' },
  { id: 'a14_ielts_writing_d3', title: 'Writing Day 3 Assignment', description: 'Proofread and edit essay.', category: 'IELTS', module: 'Writing', day: 'Day 3' },

  // IELTS Speaking (3 days)
  { id: 'a15_ielts_speaking_d1', title: 'Speaking Day 1 Assignment', description: 'Record answers to Part 1 questions.', category: 'IELTS', module: 'Speaking', day: 'Day 1' },
  { id: 'a16_ielts_speaking_d2', title: 'Speaking Day 2 Assignment', description: 'Practice cue card delivery.', category: 'IELTS', module: 'Speaking', day: 'Day 2' },
  { id: 'a17_ielts_speaking_d3', title: 'Speaking Day 3 Assignment', description: 'Engage in a mock Part 3 discussion.', category: 'IELTS', module: 'Speaking', day: 'Day 3' },

  // PTE Assignments (2 days per module)
  { id: 'a18_pt_speaking_d1', title: 'PTE Speaking Day 1 Assignment', description: 'Practice describing images.', category: 'PT', module: 'Speaking', day: 'Day 1' },
  { id: 'a19_pt_speaking_d2', title: 'PTE Speaking Day 2 Assignment', description: 'Re-tell lecture practice.', category: 'PT', module: 'Speaking', day: 'Day 2' },
  { id: 'a20_pt_writing_d1', title: 'PTE Writing Day 1 Assignment', description: 'Summarize a given text.', category: 'PT', module: 'Writing', day: 'Day 1' },
  { id: 'a21_pt_writing_d2', title: 'PTE Writing Day 2 Assignment', description: 'Write an argumentative essay.', category: 'PT', module: 'Writing', day: 'Day 2' },
  { id: 'a22_pt_reading_d1', title: 'PTE Reading Day 1 Assignment', description: 'Multiple choice, multiple answers.', category: 'PT', module: 'Reading', day: 'Day 1' },
  { id: 'a23_pt_reading_d2', title: 'PTE Reading Day 2 Assignment', description: 'Highlight correct summary.', category: 'PT', module: 'Reading', day: 'Day 2' },
  { id: 'a24_pt_listening_d1', title: 'PTE Listening Day 1 Assignment', description: 'Fill in the blanks from audio.', category: 'PT', module: 'Listening', day: 'Day 1' },
  { id: 'a25_pt_listening_d2', title: 'PTE Listening Day 2 Assignment', description: 'Select missing word.', category: 'PT', module: 'Listening', day: 'Day 2' },

  // SAT Assignments (2 days per module)
  { id: 'a26_sat_math_d1', title: 'SAT Math Day 1 Assignment', description: 'Solve practice problems: Heart of Algebra.', category: 'SAT', module: 'Math', day: 'Day 1' },
  { id: 'a27_sat_math_d2', title: 'SAT Math Day 2 Assignment', description: 'Solve practice problems: Passport to Advanced Math.', category: 'SAT', module: 'Math', day: 'Day 2' },
  { id: 'a28_sat_reading_d1', title: 'SAT Reading Day 1 Assignment', description: 'Analyze historical passage.', category: 'SAT', module: 'Reading', day: 'Day 1' },
  { id: 'a29_sat_reading_d2', title: 'SAT Reading Day 2 Assignment', description: 'Analyze science passage.', category: 'SAT', module: 'Reading', day: 'Day 2' },
  { id: 'a30_sat_writing_d1', title: 'SAT Writing Day 1 Assignment', description: 'Identify grammar errors.', category: 'SAT', module: 'Writing', day: 'Day 1' },
  { id: 'a31_sat_writing_d2', title: 'SAT Writing Day 2 Assignment', description: 'Revise sentence structure.', category: 'SAT', module: 'Writing', day: 'Day 2' },
];

const placeholderWorksheets = [
  // IELTS Listening (4 days)
  { id: 'w1_ielts_listening_d1', title: 'Listening Day 1 Worksheet', description: 'Vocabulary Builder PDF', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'IELTS', module: 'Listening', day: 'Day 1' },
  { id: 'w2_ielts_listening_d2', title: 'Listening Day 2 Worksheet', description: 'Section 1 Practice Questions PDF', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'IELTS', module: 'Listening', day: 'Day 2' },
  { id: 'w3_ielts_listening_d3', title: 'Listening Day 3 Worksheet', description: 'Conversation Analysis PDF', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'IELTS', module: 'Listening', day: 'Day 3' },
  { id: 'w4_ielts_listening_d4', title: 'Listening Day 4 Worksheet', description: 'Lecture Note-taking Template PDF', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'IELTS', module: 'Listening', day: 'Day 4' },

  // IELTS Reading (3 days)
  { id: 'w5_ielts_reading_d1', title: 'Reading Practice Test 1', description: 'Full Reading Test PDF (Passage 1)', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'IELTS', module: 'Reading', day: 'Day 1' },
  { id: 'w6_ielts_reading_d2', title: 'Reading Practice Test 2', description: 'Full Reading Test PDF (Passage 2)', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'IELTS', module: 'Reading', day: 'Day 2' },
  { id: 'w7_ielts_reading_d3', title: 'Reading Practice Test 3', description: 'Full Reading Test PDF (Passage 3)', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'IELTS', module: 'Reading', day: 'Day 3' },

  // IELTS Writing (3 days)
  { id: 'w8_ielts_writing_d1', title: 'Writing Task 1 Sample Reports', description: 'Example reports for various charts.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'IELTS', module: 'Writing', day: 'Day 1' },
  { id: 'w9_ielts_writing_d2', title: 'Writing Task 2 Essay Templates', description: 'Templates for different essay types.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'IELTS', module: 'Writing', day: 'Day 2' },
  { id: 'w10_ielts_writing_d3', title: 'Writing Grammar Checklist', description: 'Common grammar errors to avoid.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'IELTS', module: 'Writing', day: 'Day 3' },

  // IELTS Speaking (3 days)
  { id: 'w11_ielts_speaking_d1', title: 'Speaking Part 1 Question Bank', description: 'Common questions and sample answers.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'IELTS', module: 'Speaking', day: 'Day 1' },
  { id: 'w12_ielts_speaking_d2', title: 'Speaking Cue Card Topics', description: 'List of common cue card topics.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'IELTS', module: 'Speaking', day: 'Day 2' },
  { id: 'w13_ielts_speaking_d3', title: 'Speaking Part 3 Discussion Prompts', description: 'Abstract discussion questions.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'IELTS', module: 'Speaking', day: 'Day 3' },

  // PTE Worksheets (2 days per module)
  { id: 'w14_pt_speaking_d1', title: 'PTE Speaking Read Aloud Texts', description: 'Practice texts for Read Aloud.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'PT', module: 'Speaking', day: 'Day 1' },
  { id: 'w15_pt_speaking_d2', title: 'PTE Speaking Repeat Sentence Audio Scripts', description: 'Scripts for practice.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'PT', module: 'Speaking', day: 'Day 2' },
  { id: 'w16_pt_writing_d1', title: 'PTE Writing Summarize Written Text Examples', description: 'Sample summaries.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'PT', module: 'Writing', day: 'Day 1' },
  { id: 'w17_pt_writing_d2', title: 'PTE Writing Essay Prompts', description: 'Practice essay topics.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'PT', module: 'Writing', day: 'Day 2' },
  { id: 'w18_pt_reading_d1', title: 'PTE Reading Fill in Blanks Exercises', description: 'Grammar and vocabulary exercises.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'PT', module: 'Reading', day: 'Day 1' },
  { id: 'w19_pt_reading_d2', title: 'PTE Reading Re-order Paragraphs Practice', description: 'Scrambled text exercises.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'PT', module: 'Reading', day: 'Day 2' },
  { id: 'w20_pt_listening_d1', title: 'PTE Listening Summarize Spoken Text Notes', description: 'Example notes from lectures.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'PT', module: 'Listening', day: 'Day 1' },
  { id: 'w21_pt_listening_d2', title: 'PTE Listening Multiple Choice Practice', description: 'Audio and questions.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'PT', module: 'Listening', day: 'Day 2' },

  // SAT Worksheets (2 days per module)
  { id: 'w22_sat_math_d1', title: 'SAT Math Algebra Drills', description: 'Practice sheets for algebra.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'SAT', module: 'Math', day: 'Day 1' },
  { id: 'w23_sat_math_d2', title: 'SAT Math Geometry Problems', description: 'Geometry practice sheets.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'SAT', module: 'Math', day: 'Day 2' },
  { id: 'w24_sat_reading_d1', title: 'SAT Reading Practice Passages', description: 'Literature and history passages.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'SAT', module: 'Reading', day: 'Day 1' },
  { id: 'w25_sat_reading_d2', title: 'SAT Reading Paired Passages', description: 'Practice with comparative passages.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'SAT', module: 'Reading', day: 'Day 2' },
  { id: 'w26_sat_writing_d1', title: 'SAT Writing Grammar Rules', description: 'Grammar cheat sheet.', url: 'https://www.africau.edu/images/default/sample.pdf', category: 'SAT', module: 'Writing', day: 'Day 1' },
  { id: 'w27_sat_writing_d2', title: 'SAT Writing Essay Prompts.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'SAT', module: 'Writing', day: 'Day 2' },
];


const App = () => {
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null); // New state for user's full name
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appState, setAppState] = useState('loading');
  const [filterCategory, setFilterCategory] = useState('All'); // Used as the currently selected course for content display
  const [filterModule, setFilterModule] = useState('All');
  const [filterDay, setFilterDay] = useState('All');
  const [contentTab, setContentTab] = useState('videos');
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin status

  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [worksheets, setWorksheets] = useState([]); // New state for worksheets

  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [message, setMessage] = useState('');
  const [quizResults, setQuizResults] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [registeredExams, setRegisteredExams] = useState([]); // Exams user is registered for
  const [selectedExamsForRegistration, setSelectedExamsForRegistration] = useState([]); // Exams selected during registration process

  // Auth specific states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // New state for full name during registration
  const [isLoginView, setIsLoginView] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false); 
  const [newPassword, setNewPassword] = useState('');
  const [currentPasswordForReauth, setCurrentPasswordForReauth] = useState(''); // For reauthentication

  // States for adding new video manually
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoCategory, setNewVideoCategory] = useState('IELTS'); // Default to IELTS
  const [newVideoModule, setNewVideoModule] = useState('Listening'); // Default to Listening
  const [newVideoDay, setNewVideoDay] = useState('Day 1'); // Default to Day 1

  // Refs to store Firestore collection paths
  const quizCollectionPathRef = useRef(null);
  const videoCollectionPathRef = useRef(null);
  const assignmentCollectionPathRef = useRef(null);
  const worksheetCollectionPathRef = useRef(null); // Ref for worksheets
  const userScoresCollectionPathRef = useRef(null);
  const userProfilesCollectionPathRef = useRef(null);


  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    console.log("1. useEffect for Firebase init triggered.");
    if (!firebaseConfig.projectId) {
      console.error("Firebase 'projectId' is missing in config. Cannot initialize Firebase.");
      setMessage("Firebase initialization failed: Project ID is missing. Please check your Firebase configuration.");
      setAppState('auth_email_password');
      setIsAuthReady(true);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      console.log("2. Firebase app initialized.");
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setFirebaseApp(app);
      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        console.log("3. Auth listener attached. User object in onAuthStateChanged:", user);
        if (user) {
          setUserId(user.uid);
          userProfilesCollectionPathRef.current = `/artifacts/${appId}/users/${user.uid}/userProfiles`;
          const userProfileDocRef = doc(firestore, userProfilesCollectionPathRef.current, user.uid);
          console.log("Attempting to get user profile doc:", userProfileDocRef.path);
          
          try {
            const docSnap = await getDoc(userProfileDocRef);
            if (docSnap.exists()) {
              const profileData = docSnap.data();
              console.log("User profile data from Firestore:", profileData); // Debug log

              // Determine a safe 'createdAt' date string for calculations
              const effectiveCreationDate = (profileData.createdAt && !isNaN(new Date(profileData.createdAt)))
                ? profileData.createdAt
                : new Date().toISOString(); // Fallback to current date if createdAt is missing or invalid

              // Handle both old string format and new object format for registeredExams
              const currentRegisteredExams = (profileData.registeredExams || []).map(exam => {
                if (typeof exam === 'string') {
                  // For old string format, convert to object with a default expiration (e.g., 90 days from creation)
                  return { name: exam, expiration: new Date(Date.parse(effectiveCreationDate) + 90 * 24 * 60 * 60 * 1000).toISOString() };
                }
                return exam; // Already in object format
              });
              console.log("Processed registeredExams:", currentRegisteredExams); // Debug log

              setRegisteredExams(currentRegisteredExams);
              setSelectedExamsForRegistration(currentRegisteredExams.map(e => e.name)); // For the selection UI
              setIsAdmin(profileData.isAdmin || false); 
              setUserName(profileData.fullName || user.email); // Set user's full name or email

              if (currentRegisteredExams.length > 1) {
                setAppState('dashboard'); 
              } else if (currentRegisteredExams.length === 1) {
                setAppState(`${currentRegisteredExams[0].name.toLowerCase()}_home`); 
                setFilterCategory(currentRegisteredExams[0].name);
                setFilterModule('All');
                setFilterDay('All');
              } else {
                setAppState('registration'); 
              }
            } else {
              // New user profile: create with default isAdmin: false, empty exams, and provided fullName
              const newProfileCreatedAt = new Date().toISOString();
              console.log("User profile does not exist. Creating new profile for UID:", user.uid);
              await setDoc(userProfileDocRef, { 
                registeredExams: [], 
                isAdmin: false, 
                createdAt: newProfileCreatedAt, // Ensure it's explicitly set
                fullName: fullName || user.email // Save the full name, or default to email
              });
              setIsAdmin(false);
              setUserName(fullName || user.email);
              setAppState('registration'); 
              console.log("Creating new user profile with data:", { registeredExams: [], isAdmin: false, createdAt: newProfileCreatedAt, fullName: fullName || user.email }); // Debug log
            }
          } catch (profileError) {
            console.error("Error fetching or creating user profile in onAuthStateChanged:", profileError);
            setMessage(`Error loading user profile: ${profileError.message}`);
            setAppState('registration');
          } finally {
            setIsAuthReady(true);
            console.log("isAuthReady set to true.");
          }

        } else {
          console.log("No user is authenticated. Setting appState to auth_email_password.");
          setUserId(null);
          setUserName(null); // Clear user name on logout
          setRegisteredExams([]);
          setSelectedExamsForRegistration([]);
          setIsAdmin(false); 
          setAppState('auth_email_password');
          setIsAuthReady(true);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Critical Error during Firebase initialization in useEffect:", error);
      setMessage(`Firebase initialization failed: ${error.message}. Please check console.`);
      setAppState('auth_email_password');
      setIsAuthReady(true);
    }
  }, []);

  // Authentication functions (Email/Password)
  const handleEmailRegister = async () => {
    setMessage('');
    if (!email || !password || !fullName) { // Full name is now required for registration
      setMessage('Please enter your full name, email, and password.');
      return;
    }
    if (password.length < 6) {
        setMessage('Password must be at least 6 characters long.');
        return;
    }
    try {
      console.log("Attempting to register user with email:", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User registered successfully:", userCredential.user.uid);
      
      // Create user profile in Firestore with default isAdmin: false and provided fullName
      const userProfileDocRef = doc(db, `/artifacts/${appId}/users/${userCredential.user.uid}/userProfiles`, userCredential.user.uid);
      await setDoc(userProfileDocRef, { 
        registeredExams: [], 
        isAdmin: false, 
        createdAt: new Date().toISOString(),
        fullName: fullName // Save the full name
      });
      console.log("User profile created for new registration.");
      
      setMessage('Registration successful! Signing in...');
      // onAuthStateChanged listener will handle redirection
    } catch (error) {
      console.error("Error during email registration:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setMessage('Registration error: Email/Password sign-in is not enabled. Please enable it in your Firebase project settings (Authentication -> Sign-in method).');
      } else if (error.code === 'auth/email-already-in-use') {
        setMessage('Registration error: This email is already in use. Please log in or use a different email.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('Registration error: ' + error.message);
      }
      else {
        setMessage(`Registration error: ${error.message}`);
      }
    }
  };

  const handleEmailLogin = async () => {
    setMessage('');
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      return;
    }
    try {
      console.log("Attempting to log in user with email:", email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in successfully.");
      setMessage('Login successful! Redirecting...');
      // onAuthStateChanged listener will handle redirection
    } catch (error) {
      console.error("Error during email login:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setMessage('Login error: Invalid email or password.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setMessage('Login error: Email/Password sign-in is not enabled. Please enable it in your Firebase project settings (Authentication -> Sign-in method).');
      } else {
        setMessage(`Login error: ${error.message}`);
      }
    }
  };

  // Logout function
  const handleLogout = async () => {
    if (auth) {
      try {
        console.log("Attempting to log out user.");
        await signOut(auth);
        console.log("User logged out successfully.");
        setMessage('You have been logged out.');
        setEmail(''); // Clear email/password on logout
        setPassword('');
        setFullName(''); // Clear full name on logout
      } catch (error) {
        console.error("Error during logout:", error);
        setMessage(`Logout error: ${error.message}`);
      }
    } else {
      setMessage("Cannot log out, authentication service not active.");
    }
  };

  // Change Password Function
  const handleChangePassword = async () => {
    setMessage('');
    if (!newPassword || !currentPasswordForReauth) {
      setMessage('Please enter both current and new password.');
      return;
    }
    if (!auth.currentUser) {
      setMessage('No user is logged in.');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('New password should be at least 6 characters.');
      return;
    }

    try {
      console.log("Attempting to change password for user:", auth.currentUser.email);
      // Reauthenticate with current credentials
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPasswordForReauth);
      await reauthenticateWithCredential(auth.currentUser, credential);
      console.log("User reauthenticated successfully.");
      
      await updatePassword(auth.currentUser, newPassword);
      console.log("Password updated successfully.");
      setMessage('Password updated successfully!');
      setNewPassword('');
      setCurrentPasswordForReauth('');
      setShowChangePasswordModal(false);
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.code === 'auth/requires-recent-login') {
        setMessage('Please re-enter your current password (session expired or security sensitive operation).');
      } else if (error.code === 'auth/wrong-password') {
        setMessage('Incorrect current password.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('New password: ' + error.message);
      }
      else {
        setMessage(`Error changing password: ${error.message}`);
      }
    }
  };


  // Load content (videos, quizzes, assignments, worksheets) and initialize sample data if necessary
  useEffect(() => {
    // Only proceed if db, auth is ready and userId is set
    if (!db || !auth || !isAuthReady || !userId) {
        console.log("Skipping content load useEffect: DB or Auth not ready, or userId is null.");
        return;
    }
    console.log("4. Content loading useEffect triggered for userId:", userId);

    const basePublicPath = `/artifacts/${appId}/public/data`;
    videoCollectionPathRef.current = `${basePublicPath}/videos`;
    quizCollectionPathRef.current = `${basePublicPath}/quizzes`;
    assignmentCollectionPathRef.current = `${basePublicPath}/assignments`;
    worksheetCollectionPathRef.current = `${basePublicPath}/worksheets`; 
    userScoresCollectionPathRef.current = `/artifacts/${appId}/users/${userId}/userScores`;
    
    console.log("Firestore Collection Paths initialized:", {
        videos: videoCollectionPathRef.current,
        quizzes: quizCollectionPathRef.current,
        assignments: assignmentCollectionPathRef.current,
        worksheets: worksheetCollectionPathRef.current,
        userScores: userScoresCollectionPathRef.current
    });


    const videosCollection = collection(db, videoCollectionPathRef.current);
    const quizzesCollection = collection(db, quizCollectionPathRef.current);
    const assignmentsCollection = collection(db, assignmentCollectionPathRef.current);
    const worksheetsCollection = collection(db, worksheetCollectionPathRef.current);

    const addSampleData = async () => { 
      try {
        console.log("Checking if sample data needs to be added.");
        const videoDocs = await getDocs(videosCollection); 
        if (videoDocs.empty) {
          console.log("Adding placeholder videos...");
          for (const video of placeholderVideos) {
            await setDoc(doc(videosCollection, video.id), video);
          }
          console.log("Placeholder videos added.");
        }

        const quizDocs = await getDocs(quizzesCollection);
        if (quizDocs.empty) {
            console.log("Adding placeholder quizzes...");
          for (const quiz of sampleQuizzes) {
            await setDoc(doc(quizzesCollection, quiz.id), quiz);
          }
          console.log("Placeholder quizzes added.");
        }

        const assignmentDocs = await getDocs(assignmentsCollection);
        if (assignmentDocs.empty) {
            console.log("Adding placeholder assignments...");
          for (const assignment of placeholderAssignments) {
            await setDoc(doc(assignmentsCollection, assignment.id), assignment);
          }
          console.log("Placeholder assignments added.");
        }

        const worksheetDocs = await getDocs(worksheetCollection); 
        if (worksheetDocs.empty) {
            console.log("Adding placeholder worksheets...");
          for (const worksheet of placeholderWorksheets) {
            await setDoc(doc(worksheetCollection, worksheet.id), worksheet);
          }
          console.log("Placeholder worksheets added.");
        }
        console.log("Sample data check/addition complete.");

      } catch (error) {
        console.error("Error adding sample data:", error);
        setMessage(`Error populating sample data: ${error.message}`);
      }
    };

    addSampleData();

    // Setup real-time listeners
    console.log("Setting up Firestore real-time listeners...");
    const unsubscribeVideos = onSnapshot(videosCollection, (snapshot) => {
      const videoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(videoList);
      console.log("Videos updated via onSnapshot. Count:", videoList.length);
    }, (error) => {
      console.error("Error fetching videos with onSnapshot:", error);
      setMessage(`Error fetching videos: ${error.message}`);
    });

    const unsubscribeQuizzes = onSnapshot(quizzesCollection, (snapshot) => {
      const quizList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuizzes(quizList);
      console.log("Quizzes updated via onSnapshot. Count:", quizList.length);
    }, (error) => {
      console.error("Error fetching quizzes with onSnapshot:", error);
      setMessage(`Error fetching quizzes: ${error.message}`);
    });

    const unsubscribeAssignments = onSnapshot(assignmentsCollection, (snapshot) => {
      const assignmentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(assignmentList);
      console.log("Assignments updated via onSnapshot. Count:", assignmentList.length);
    }, (error) => {
      console.error("Error fetching assignments with onSnapshot:", error);
      setMessage(`Error fetching assignments: ${error.message}`);
    });

    const unsubscribeWorksheets = onSnapshot(worksheetCollection, (snapshot) => { 
      const worksheetList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorksheets(worksheetList);
      console.log("Worksheets updated via onSnapshot. Count:", worksheetList.length);
    }, (error) => {
      console.error("Error fetching worksheets with onSnapshot:", error);
      setMessage(`Error fetching worksheets: ${error.message}`);
    });


    return () => {
      console.log("Cleaning up Firestore listeners.");
      unsubscribeVideos();
      unsubscribeQuizzes();
      unsubscribeAssignments();
      unsubscribeWorksheets(); 
    };
  }, [db, auth, isAuthReady, appId, userId]); // Added auth to dependency array to ensure re-run on auth state changes


  const handleVideoSelect = (url) => {
    setSelectedVideoUrl(url);
    setCurrentQuiz(null); // Deselect quiz when video is selected
    setContentTab('videos');
  };

  const startQuiz = (quiz) => {
    setSelectedVideoUrl(null); // Deselect video when quiz is selected
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizCompleted(false);
    setMessage('');
    setQuizResults([]);
    setContentTab('quizzes');
  };

  const handleAnswerSubmit = (selectedOption) => {
    if (!currentQuiz || !currentQuiz.questions) return;

    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;

    setQuizResults(prev => [...prev, {
      question: currentQuestion.questionText,
      selected: selectedOption,
      correct: currentQuestion.correctAnswer,
      isCorrect: isCorrect
    }]);

    if (isCorrect) {
      setQuizScore(prevScore => prevScore + 1);
      setMessage('Correct!');
    } else {
      setMessage('Incorrect. The correct answer was: ' + currentQuestion.correctAnswer);
    }

    setTimeout(() => {
      setMessage('');
      if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        setQuizCompleted(true);
        saveQuizScore();
      }
    }, 1500);
  };

  const saveQuizScore = async () => {
    if (!db || !userId || !currentQuiz || !userScoresCollectionPathRef.current) {
      console.error("Cannot save score: Firebase or user not ready, or quiz not selected.");
      return;
    }

    try {
      console.log("Attempting to save quiz score...");
      const userScoresCollection = collection(db, userScoresCollectionPathRef.current);
      await addDoc(userScoresCollection, {
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.title,
        score: quizScore,
        totalQuestions: currentQuiz.questions.length,
        timestamp: new Date().toISOString(),
        userId: userId,
      });
      console.log("Quiz score saved successfully.");
      setMessage('Quiz completed! Your score has been saved.');
    } catch (error) {
      console.error("Error saving quiz score:", error);
      setMessage(`Error saving score: ${error.message}`);
    }
  };

  const resetQuiz = () => {
    setConfirmationAction(() => () => startQuiz(currentQuiz));
    setShowConfirmation(true);
  };

  const confirmAction = () => {
    if (confirmationAction) {
      confirmationAction();
    }
    setShowConfirmation(false);
    setConfirmationAction(null);
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationAction(null);
  };

  // Allows multiple exams to be toggled
  const toggleExamRegistration = (exam) => {
    setSelectedExamsForRegistration(prev =>
      prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]
    );
  };

  const handleRegisterExams = async () => {
    setMessage('');
    if (!db || !userId || !userProfilesCollectionPathRef.current) {
      setMessage('System error: Firebase or user not ready.');
      console.error("handleRegisterExams: Firebase or user not ready.");
      return;
    }
    if (selectedExamsForRegistration.length === 0) {
      setMessage('Please select at least one exam to register.');
      return;
    }

    try {
      console.log("Attempting to register exams for user:", userId);
      const userProfileDocRef = doc(db, userProfilesCollectionPathRef.current, userId);
      // Map selected exam names to objects with expiration dates
      const examsToSave = selectedExamsForRegistration.map(examName => {
        // If the course was already registered, try to preserve its existing expiration date
        const existingExam = registeredExams.find(e => e.name === examName);
        if (existingExam && existingExam.expiration && !isNaN(new Date(existingExam.expiration))) {
          console.log(`Preserving existing expiration for ${examName}:`, existingExam.expiration);
          return existingExam;
        }
        // Otherwise, set a new expiration date 7 days from now for testing (was 30)
        const newExpirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        console.log(`Setting new expiration for ${examName}:`, newExpirationDate);
        return { name: examName, expiration: newExpirationDate };
      });

      await setDoc(userProfileDocRef, {
        registeredExams: examsToSave,
        lastUpdated: new Date().toISOString(),
        isAdmin: isAdmin, // Preserve existing admin status
        fullName: userName || fullName || email // Preserve existing full name, or use registration full name, or email
      }, { merge: true }); // Use merge to update without overwriting other fields
      
      setRegisteredExams(examsToSave);
      setMessage('Registration successful! Redirecting...');
      console.log("Exams registered/updated successfully:", examsToSave);
      
      // Dynamic redirection after registration
      if (examsToSave.length > 1) {
        setAppState('dashboard'); 
      } else if (examsToSave.length === 1) { 
        setAppState(`${examsToSave[0].name.toLowerCase()}_home`); 
        setFilterCategory(examsToSave[0].name);
        setFilterModule('All');
        setFilterDay('All');
      } else { 
        setAppState('registration');
      }
      
    } catch (error) {
      console.error("Error registering exams:", error);
      setMessage(`Error registering: ${error.message}`);
    }
  };

  const handleAddVideo = async () => {
    setMessage('');
    if (!newVideoTitle || !newVideoUrl || !newVideoCategory || !newVideoModule || !newVideoDay) {
      setMessage('Please fill all video fields.');
      return;
    }
    if (!db || !videoCollectionPathRef.current) {
      setMessage('Database not ready. Cannot add video.');
      return;
    }

    try {
      console.log("Attempting to add new video.");
      const videosCollection = collection(db, videoCollectionPathRef.current);
      await addDoc(videosCollection, {
        title: newVideoTitle,
        description: newVideoDescription,
        url: newVideoUrl,
        category: newVideoCategory,
        module: newVideoModule,
        day: newVideoDay,
        timestamp: new Date().toISOString(),
        addedBy: userId,
      });
      console.log("Video added successfully.");
      setMessage('Video added successfully!');
      setNewVideoTitle('');
      setNewVideoDescription('');
      setNewVideoUrl('');
      // Keep category, module, day for quick successive adds
    } catch (error) {
      console.error("Error adding video:", error);
      setMessage(`Error adding video: ${error.message}`);
    }
  };

  // Function to switch main content view to a specific course
  const goToCourseHome = (course) => {
    console.log("Navigating to course home:", course);
    setAppState(`${course.toLowerCase()}_home`);
    setFilterCategory(course); // Set the category filter to the selected course
    setFilterModule('All'); // Reset module filter
    setFilterDay('All'); // Reset day filter
    setSelectedVideoUrl(null); // Clear any active video
    setCurrentQuiz(null); // Clear any active quiz
    setContentTab('videos'); // Default to videos tab
  };


  const applyContentFilters = (contentList) => {
    // If no exams registered or no user, show nothing
    if (registeredExams.length === 0 && !userId) {
      return [];
    }
    
    // Primary filter: Only show content for the currently selected filterCategory (i.e., the active course)
    let filtered = contentList.filter(item => item.category === filterCategory);

    // Apply module filter if set (e.g., 'Listening', 'Reading')
    if (filterModule !== 'All') {
      filtered = filtered.filter(item => item.module === filterModule);
    }

    // Apply day filter based on selected category and module
    if (filterDay !== 'All') {
      filtered = filtered.filter(item => item.day === filterDay);
    }

    return filtered;
  };

  const getModuleOptions = (category) => {
    switch (category) {
        case 'IELTS':
            return ['All', 'Reading', 'Writing', 'Speaking', 'Listening'];
        case 'PT':
            return ['All', 'Speaking', 'Writing', 'Reading', 'Listening'];
        case 'SAT':
            return ['All', 'Math', 'Reading', 'Writing'];
        default:
            return ['All'];
    }
  };

  // This function is used for both display filtering and the admin form's dropdowns.
  // It uses `filterCategory` and `filterModule` for display, and `newVideoCategory`/`newVideoModule` for admin form.
  const getDayOptions = () => {
    const currentCategory = appState === 'add_video' ? newVideoCategory : filterCategory;
    const currentModule = appState === 'add_video' ? newVideoModule : filterModule;

    if (currentCategory === 'IELTS') {
      switch (currentModule) {
        case 'Listening':
          return ['All', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8'];
        case 'Reading':
        case 'Writing':
        case 'Speaking':
          return ['All', 'Day 1', 'Day 2', 'Day 3'];
        default:
          return ['All'];
      }
    } else if (currentCategory === 'PT') {
      switch (currentModule) {
        case 'Speaking':
        case 'Writing':
        case 'Reading':
        case 'Listening':
          return ['All', 'Day 1', 'Day 2'];
        default:
          return ['All'];
      }
    } else if (currentCategory === 'SAT') {
      switch (currentModule) {
        case 'Math':
        case 'Reading':
        case 'Writing':
          return ['All', 'Day 1', 'Day 2'];
        default:
          return ['All'];
      }
    }
    return ['All']; 
  };


  // Calculate upcoming expirations
  const upcomingExpirations = registeredExams.filter(exam => {
    // Ensure exam.expiration exists and is a valid date string BEFORE parsing
    if (!exam.expiration || isNaN(Date.parse(exam.expiration))) {
      console.warn("Skipping invalid expiration date for reminder:", exam.name, exam.expiration); // Debug log
      return false; // Skip if expiration is missing or invalid
    }
    const expirationDate = new Date(exam.expiration);
    const today = new Date();
    // Set today's time to 00:00:00 to compare full days
    today.setHours(0, 0, 0, 0); 
    expirationDate.setHours(0, 0, 0, 0); // Also set expiration to start of day for consistent comparison

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(`Exam: ${exam.name}, Expiration: ${exam.expiration}, Current Date: ${new Date().toISOString()}, DiffDays: ${diffDays}`); // Debug log
    return diffDays > 0 && diffDays <= 30; // Within the next 30 days, and not already expired
  }).sort((a, b) => {
    const dateA = new Date(a.expiration);
    const dateB = new Date(b.expiration);
    // Handle invalid dates during sorting as well, push them to the end or just compare valid ones
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0; // Both invalid, treat as equal for sorting
    if (isNaN(dateA.getTime())) return 1; // A is invalid, push to end
    if (isNaN(dateB.getTime())) return -1; // B is invalid, push to end
    return dateA.getTime() - dateB.getTime();
  });


  const filteredVideos = applyContentFilters(videos);
  const filteredQuizzes = applyContentFilters(quizzes);
  const filteredAssignments = applyContentFilters(assignments);
  const filteredWorksheets = applyContentFilters(worksheets); // Filter worksheets


  // Ensure dynamic resizing of main content area (using Tailwind-like media queries via inline styles)
  useEffect(() => {
    const handleResize = () => {
      const mainElement = document.querySelector('main');
      const contentGridElements = document.querySelectorAll('.content-grid');

      if (!mainElement) {
        return;
      }

      if (window.innerWidth >= 1024) { // Equivalent to lg:flex-row
        mainElement.style.flexDirection = 'row';
        contentGridElements.forEach(el => el.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))'); // lg:grid-cols-3
      } else if (window.innerWidth >= 768) { // Equivalent to md:flex-col, md:grid-cols-2
        mainElement.style.flexDirection = 'column'; // Keep sidebar and content stacked as columns
        contentGridElements.forEach(el => el.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))');
      } else { // Mobile: flex-col, grid-cols-1
        mainElement.style.flexDirection = 'column';
        contentGridElements.forEach(el => el.style.gridTemplateColumns = 'repeat(1, minmax(0, 1fr))');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Temporary function to toggle admin status for testing
  const toggleAdminStatus = async () => {
    if (!db || !userId || !userProfilesCollectionPathRef.current) {
        setMessage('Cannot toggle admin status: Firebase or user not ready.');
        return;
    }
    const userProfileDocRef = doc(db, userProfilesCollectionPathRef.current, userId);
    try {
        console.log("Toggling admin status for user:", userId, "Current isAdmin:", isAdmin);
        await setDoc(userProfileDocRef, { isAdmin: !isAdmin }, { merge: true });
        setIsAdmin(prev => !prev);
        setMessage(`Admin status toggled to: ${!isAdmin}`);
        console.log("Admin status successfully toggled.");
    } catch (error) {
        console.error("Error toggling admin status:", error);
        setMessage(`Error toggling admin status: ${error.message}`);
    }
  };


  if (appState === 'loading') {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingMessage}>
          Loading Firebase and authenticating...
        </div>
      </div>
    );
  }

  // --- Authentication Screen (Email/Password ONLY) ---
  if (appState === 'auth_email_password') {
    return (
      <div style={styles.fullScreenCenter}>
        <div style={styles.authCard}>
          <h2 style={styles.authTitle}>Welcome to StudyPrep!</h2>
          <p style={styles.authText}>
            {isLoginView ? 'Sign in using your email and password' : 'Create a new account with email and password'}
          </p>

          {!isLoginView && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.authInput}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.authInput}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.authInput}
          />

          <div style={styles.authButtonsContainer}>
            {isLoginView ? (
              <button onClick={handleEmailLogin} style={styles.authButton}>
                Login
              </button>
            ) : (
              <button onClick={handleEmailRegister} style={styles.authButton}>
                Register
              </button>
            )}
            <button
              onClick={() => { setIsLoginView(!isLoginView); setMessage(''); }} // Clear message on toggle
              style={styles.toggleAuthViewButton}
            >
              {isLoginView ? 'New user? Register here' : 'Already have an account? Login'}
            </button>
          </div>

          {message && (
            <p style={message.includes('Error') ? styles.errorMessage : styles.successMessage}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Registration Screen (Exam Selection) ---
  if (appState === 'registration') {
    return (
      <div style={styles.fullScreenCenter}>
        <div style={styles.registrationCard}>
          <h2 style={styles.registrationTitle}>{registeredExams.length > 0 ? 'Manage Your Courses' : 'Welcome! Register for Courses'}</h2>
          <p style={styles.registrationText}>Select the courses you'd like to prepare for:</p>

          <div style={styles.examSelectionContainer}>
            {['IELTS', 'PT', 'SAT'].map(exam => (
                <button
                key={exam}
                onClick={() => toggleExamRegistration(exam)}
                style={selectedExamsForRegistration.includes(exam) ? styles.examButtonSelected : styles.examButton}
                >
                {exam}
                </button>
            ))}
          </div>

          <button
            onClick={handleRegisterExams}
            disabled={selectedExamsForRegistration.length === 0}
            style={selectedExamsForRegistration.length > 0 ? styles.startButton : styles.startButtonDisabled}
          >
            {registeredExams.length > 0 ? 'Update Registration' : 'Start Preparing!'}
          </button>
          {message && (
            <p style={message.includes('Error') ? styles.errorMessage : styles.successMessage}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Manually Add Video Screen (Admin Only) ---
  if (appState === 'add_video') {
    if (!isAdmin) {
        return (
            <div style={styles.fullScreenCenter}>
                <div style={styles.authCard}>
                    <h2 style={styles.authTitle}>Access Denied</h2>
                    <p style={styles.authText}>You do not have administrative privileges to add videos.</p>
                    <button onClick={() => setAppState('dashboard')} style={styles.authButton}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }
    return (
      <div style={styles.fullScreenCenter}>
        <div style={styles.authCard}> {/* Reusing authCard style for a consistent look */}
          <h2 style={styles.authTitle}>Add New Video</h2>
          <input
            type="text"
            placeholder="Video Title"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            style={styles.authInput}
          />
          <textarea
            placeholder="Video Description"
            value={newVideoDescription}
            onChange={(e) => setNewVideoDescription(e.target.value)}
            style={{ ...styles.authInput, height: '80px', resize: 'vertical' }}
          />
          <input
            type="text"
            placeholder="Video URL (e.g., https://example.com/video.mp4)"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            style={styles.authInput}
          />
          <select
            value={newVideoCategory}
            onChange={(e) => {
              setNewVideoCategory(e.target.value);
              setNewVideoModule('All'); // Reset module when category changes
              setNewVideoDay('All'); // Reset day when category changes
            }}
            style={styles.authInput}
          >
            <option value="IELTS">IELTS</option>
            <option value="PT">PT</option>
            <option value="SAT">SAT</option>
          </select>
          <select
            value={newVideoModule}
            onChange={(e) => {
              setNewVideoModule(e.target.value);
              setNewVideoDay('All'); // Reset day when module changes
            }}
            style={styles.authInput}
          >
            {getModuleOptions(newVideoCategory).map(module => (
                <option key={module} value={module}>{module}</option>
            ))}
          </select>
          <select
            value={newVideoDay}
            onChange={(e) => setNewVideoDay(e.target.value)}
            style={styles.authInput}
          >
            {getDayOptions().map(day => ( // Pass category and module
                <option key={day} value={day}>{day}</option>
            ))}
          </select>

          <button onClick={handleAddVideo} style={styles.authButton}>
            Add Video
          </button>
          <button onClick={() => setAppState('dashboard')} style={styles.toggleAuthViewButton}>
            ← Back to Dashboard
          </button>
          {message && (
            <p style={message.includes('Error') ? styles.errorMessage : styles.successMessage}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }


  // --- Main App Dashboard and Content ---
  return (
    <div style={styles.appContainer}>
      {/* Embedded CSS Styles */}
      <style>{`
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .flex-row-lg { display: flex; flex-direction: column; }
        @media (min-width: 1024px) {
          .flex-row-lg { flex-direction: row; }
        }
        .grid-cols-1 { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) {
          .md-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .lg-grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        .col-span-full { grid-column: span / span; }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>StudyPrep!</h1> {/* Updated title */}
        <div style={styles.headerRight}>
          <div style={styles.userIdDisplay}>
            Welcome, {userName || 'Guest'}! {isAdmin && '(Admin)'} {/* Show user name and admin status */}
          </div>
          {userId && ( // Only show if a user is logged in
            <button onClick={toggleAdminStatus} style={styles.changePasswordButton}>
              Toggle Admin Status
            </button>
          )}
          <button onClick={() => setShowChangePasswordModal(true)} style={styles.changePasswordButton}>
            Change Password
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Sidebar/Navigation */}
        <div style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>Navigation</h2>
          <nav style={styles.navContainer}>
             <button
              onClick={() => { setAppState('dashboard'); setSelectedVideoUrl(null); setCurrentQuiz(null); setFilterCategory('All'); setFilterModule('All'); setFilterDay('All'); }}
              style={appState === 'dashboard' ? styles.navButtonSelected : styles.navButton}
            >
              Dashboard
            </button>

            {/* Dynamic Course Buttons based on registration */}
            {registeredExams.length > 0 && (
                <div style={styles.filterSection}>
                    <h3 style={styles.filterTitle}>My Courses</h3>
                    <nav style={styles.navContainer}>
                        {registeredExams.map(exam => (
                            <button
                                key={exam.name} // Use exam.name for key
                                onClick={() => goToCourseHome(exam.name)}
                                style={filterCategory === exam.name ? styles.navButtonSelected : styles.navButton}
                            >
                                {exam.name} Prep
                            </button>
                        ))}
                    </nav>
                </div>
            )}
          </nav>

          {/* Dynamic Module Navigation (based on selected Course/filterCategory) */}
          {filterCategory !== 'All' && ( 
            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>{filterCategory} Modules</h3>
              <nav style={styles.navContainer}>
                {getModuleOptions(filterCategory).filter(mod => mod !== 'All').map(module => (
                  <button
                    key={module}
                    onClick={() => { setFilterModule(module); setFilterDay('All'); setContentTab('videos'); }}
                    style={filterModule === module ? styles.navButtonSelected : styles.navButton}
                  >
                    {module}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Dynamic Day Filter (based on selected Course/filterCategory and Module) */}
          {filterCategory !== 'All' && filterModule !== 'All' && getDayOptions().length > 1 && ( // Only show if there are actual days beyond 'All'
            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>{filterModule} Days</h3>
              <div style={styles.filterButtonsContainer}>
                {getDayOptions().map(day => (
                  <button
                    key={day}
                    onClick={() => setFilterDay(day)}
                    style={filterDay === day ? styles.filterButtonSelected : styles.filterButton}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add Video Button (Admin Only) */}
          {isAdmin && (
            <div style={styles.manageExamsContainer}>
              <button
                onClick={() => setAppState('add_video')}
                style={styles.manageExamsButton}
              >
                Add New Video
              </button>
            </div>
          )}

          {appState === 'dashboard' && (
            <div style={styles.manageExamsContainer}>
              <button
                onClick={() => setAppState('registration')}
                style={styles.manageExamsButton}
              >
                Manage Courses
              </button>
            </div>
          )}
        </div>

        {/* Content Display Area */}
        <div style={styles.contentArea}>
          {message && (
            <div style={message.includes('Error') ? styles.messageError : styles.successMessage}>
              {message}
            </div>
          )}

          {/* Dashboard View (Shows when appState is 'dashboard') */}
          {appState === 'dashboard' && (
            <div>
              <h2 style={styles.contentTitle}>Your Dashboard</h2>
              {registeredExams.length > 0 ? (
                <>
                  <p style={styles.dashboardText}>You are currently registered for the following courses:</p>
                  <ul style={styles.dashboardList}>
                    {registeredExams.map(exam => (
                      <li key={exam.name} style={styles.dashboardListItem}>{exam.name}</li>
                    ))}
                  </ul>
                  {upcomingExpirations.length > 0 && (
                    <div style={styles.expirationReminderBox}>
                      <h3 style={styles.expirationReminderTitle}>Upcoming Expirations!</h3>
                      <ul style={styles.expirationReminderList}>
                        {upcomingExpirations.map(exam => {
                          const expirationDate = new Date(exam.expiration);
                          // No need to recalculate diffDays here, already done in upcomingExpirations filter/sort
                          const diffDays = Math.ceil((expirationDate.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                          return (
                            <li key={exam.name} style={styles.expirationReminderItem}>
                              <span style={styles.expirationCourseName}>{exam.name}</span> expires in <span style={styles.expirationDays}>{diffDays}</span> days.
                            </li>
                          );
                        })}
                      </ul>
                      <p style={styles.expirationCallToAction}>Contact support to extend your courses!</p>
                    </div>
                  )}
                  <p style={styles.dashboardText}>
                    Select a course from "My Courses" on the left to start preparing!
                  </p>
                </>
              ) : (
                <p style={styles.dashboardText}>
                  You are not currently registered for any courses. Please use the "Manage Courses" button to get started!
                </p>
              )}
            </div>
          )}

          {/* Course Module Home (IELTS, PT, SAT based on filterCategory) */}
          {(filterCategory !== 'All' && appState.endsWith('_home')) && (
            <div>
              <h2 style={styles.contentTitle}>
                {filterCategory} Prep - {filterModule !== 'All' ? `${filterModule} Module` : 'Overview'}
                {filterDay !== 'All' ? ` - ${filterDay}` : ''}
              </h2>
              
              <div style={styles.contentTabs}>
                <button
                  onClick={() => setContentTab('videos')}
                  style={contentTab === 'videos' ? styles.contentTabSelected : styles.contentTab}
                >
                  Videos
                </button>
                <button
                  onClick={() => setContentTab('assignments')}
                  style={contentTab === 'assignments' ? styles.contentTabSelected : styles.contentTab}
                >
                  Assignments
                </button>
                <button
                  onClick={() => setContentTab('quizzes')}
                  style={contentTab === 'quizzes' ? styles.contentTabSelected : styles.contentTab}
                >
                  Quizzes
                </button>
                <button
                  onClick={() => setContentTab('worksheets')}
                  style={contentTab === 'worksheets' ? styles.contentTabSelected : styles.contentTab}
                >
                  Worksheets
                </button>
              </div>

              {selectedVideoUrl ? (
                <div style={styles.videoPlayerContainer}>
                  <button
                    onClick={() => setSelectedVideoUrl(null)}
                    style={styles.backButton}
                  >
                    ← Back to {contentTab.charAt(0).toUpperCase() + contentTab.slice(1)}
                  </button>
                  <video controls style={styles.videoPlayer}>
                    <source src={selectedVideoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : currentQuiz && currentQuiz.questions && !quizCompleted ? (
                <div style={styles.quizActiveContainer}>
                  <button
                    onClick={() => {
                        setConfirmationAction(() => () => setCurrentQuiz(null));
                        setShowConfirmation(true);
                    }}
                    style={styles.backButton}
                  >
                    ← Back to Quizzes
                  </button>
                  <h3 style={styles.quizTitle}>{currentQuiz.title}</h3>
                  <div style={styles.questionProgress}>
                    Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
                  </div>
                  <p style={styles.questionText}>{currentQuiz.questions[currentQuestionIndex].questionText}</p>
                  <div style={styles.optionsContainer}>
                    {currentQuiz.questions[currentQuestionIndex].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSubmit(option)}
                        style={styles.optionButton}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : currentQuiz && quizCompleted ? (
                <div style={styles.quizCompletedContainer}>
                  <h3 style={styles.quizCompletedTitle}>Quiz Completed!</h3>
                  <p style={styles.quizScore}>
                    You scored {quizScore} out of {currentQuiz.questions.length}!
                  </p>
                  <div style={styles.quizActions}>
                    <button
                      onClick={() => setCurrentQuiz(null)}
                      style={styles.backToQuizzesButton}
                    >
                      Back to Quizzes
                    </button>
                    <button
                      onClick={resetQuiz}
                      style={styles.retakeQuizButton}
                    >
                      Retake Quiz
                    </button>
                  </div>
                  <div style={styles.yourAnswersContainer}>
                    <h4 style={styles.yourAnswersTitle}>Your Answers:</h4>
                    {quizResults.map((result, index) => (
                      <div key={index} style={styles.answerReviewCard}>
                        <p style={styles.answerQuestion}>Q{index + 1}: {result.question}</p>
                        <p style={result.isCorrect ? styles.answerCorrect : styles.answerIncorrect}>
                          Your Answer: <span style={styles.answerText}>{result.selected}</span>
                          {!result.isCorrect && (
                            <span style={styles.correctAnswerText}>Correct Answer: <span style={styles.answerText}>{result.correct}</span></span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={styles.contentGrid}>
                  {contentTab === 'videos' && (
                    filteredVideos.length > 0 ? (
                      filteredVideos.map(video => (
                        <div key={video.id} style={styles.card} onClick={() => handleVideoSelect(video.url)}>
                          <h3 style={styles.cardTitle}>{video.title}</h3>
                          <p style={styles.cardDescription}>{video.description}</p>
                          <span style={styles.videoCategoryTag}>{video.category} - {video.module} - {video.day}</span>
                        </div>
                      ))
                    ) : (
                      <p style={styles.noContentMessage}>No videos available for this selection.</p>
                    )
                  )}
                  {contentTab === 'assignments' && (
                    filteredAssignments.length > 0 ? (
                      filteredAssignments.map(assignment => (
                        <div key={assignment.id} style={styles.card}>
                          <h3 style={styles.cardTitle}>{assignment.title}</h3>
                          <p style={styles.cardDescription}>{assignment.description}</p>
                          <span style={styles.assignmentCategoryTag}>{assignment.category} - {assignment.module} - {assignment.day}</span>
                        </div>
                      ))
                    ) : (
                      <p style={styles.noContentMessage}>No assignments available for this selection.</p>
                    )
                  )}
                  {contentTab === 'quizzes' && (
                    filteredQuizzes.length > 0 ? (
                      filteredQuizzes.map(quiz => (
                        <div key={quiz.id} style={styles.card} onClick={() => startQuiz(quiz)}>
                          <h3 style={styles.cardTitle}>{quiz.title}</h3>
                          <p style={styles.cardDescription}>{quiz.description}</p>
                          <span style={styles.quizCategoryTag}>{quiz.category} - {quiz.module} - {quiz.day}</span>
                        </div>
                      ))
                    ) : (
                      <p style={styles.noContentMessage}>No quizzes available for this selection.</p>
                    )
                  )}
                  {contentTab === 'worksheets' && ( // Display worksheets
                    filteredWorksheets.length > 0 ? (
                      filteredWorksheets.map(worksheet => (
                        <a key={worksheet.id} href={worksheet.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <div style={{ ...styles.card, backgroundColor: '#e0f2fe' }}>
                            <h3 style={{ ...styles.cardTitle, color: '#0284c7' }}>{worksheet.title}</h3>
                            <p style={styles.cardDescription}>{worksheet.description}</p>
                            <span style={{ ...styles.assignmentCategoryTag, backgroundColor: '#0ea5e9' }}>{worksheet.category} - {worksheet.module} - {worksheet.day}</span>
                          </div>
                        </a>
                      ))
                    ) : (
                      <p style={styles.noContentMessage}>No worksheets available for this selection.</p>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Confirm Action</h3>
            <p style={styles.modalText}>Are you sure you want to {confirmationAction === resetQuiz ? 'retake this quiz' : 'leave the current quiz'}? Your current progress will be lost.</p>
            <div style={styles.modalButtonsContainer}>
              <button
                onClick={cancelConfirmation}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                style={styles.modalConfirmButton}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Change Password</h3>
            <p style={styles.modalText}>Enter your current password and then your new password.</p>
             <input
              type="password"
              placeholder="Current Password (for verification)"
              value={currentPasswordForReauth}
              onChange={(e) => setCurrentPasswordForReauth(e.target.value)}
              style={styles.authInput} // Reusing authInput style
            />
            <input
              type="password"
              placeholder="New Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.authInput} // Reusing authInput style
            />
            <div style={styles.modalButtonsContainer}>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                style={styles.modalConfirmButton}
              >
                Change Password
  </button>
            </div>
            {message && (
              <p style={message.includes('Error') ? styles.errorMessage : styles.successMessage}>
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Basic CSS Styles as an object for inline styling
const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontFamily: 'Inter',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Inter',
  },
  loadingMessage: {
    fontSize: '1.25rem',
    color: '#4b5563',
    padding: '1rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    backgroundColor: '#fff',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  header: {
    background: 'linear-gradient(to right, #2563eb, #4f46e5)',
    color: '#fff',
    padding: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '0 0 0.5rem 0.5rem',
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  headerTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    margin: 0,
    paddingRight: '1rem', // Add some space for wrapping
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem', // Slightly reduced gap for mobile
    flexWrap: 'wrap', // Allow buttons to wrap
    justifyContent: 'flex-end', // Align buttons to end
    marginTop: '0.5rem', // Add top margin when wrapped
  },
  userIdDisplay: {
    fontSize: '0.875rem',
    fontWeight: '500',
    flexBasis: '100%', // Take full width on small screens
    textAlign: 'right', // Align to right
    marginBottom: '0.5rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    borderRadius: '0.5rem',
    transition: 'background-color 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    minWidth: 'fit-content', // Prevent shrinking
  },
  changePasswordButton: { 
    padding: '0.5rem 1rem',
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '0.5rem',
    transition: 'background-color 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    minWidth: 'fit-content',
  },
  mainContent: {
    flex: 1,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column', // Default to column for mobile
    gap: '1.5rem', // Slightly reduced gap for mobile
  },
  sidebar: {
    width: '100%', // Full width on mobile
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    height: 'fit-content',
    border: '1px solid #e5e7eb',
  },
  sidebarTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#374151',
  },
  navContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  navButton: {
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '1rem', // Slightly smaller font for mobile
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%', // Full width buttons
  },
  navButtonSelected: {
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '1rem', // Slightly smaller font for mobile
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#3b82f6',
    color: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%', // Full width buttons
  },
  filterSection: {
    marginTop: '1.5rem',
  },
  filterTitle: {
    fontSize: '1.125rem', // Slightly smaller font for mobile
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#374151',
  },
  filterButtonsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  filterButton: {
    padding: '0.4rem 0.8rem', // Smaller padding
    borderRadius: '9999px',
    fontSize: '0.75rem', // Smaller font
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    cursor: 'pointer',
  },
  filterButtonSelected: {
    padding: '0.4rem 0.8rem', // Smaller padding
    borderRadius: '9999px',
    fontSize: '0.75rem', // Smaller font
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#6366f1',
    color: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: 'none',
    cursor: 'pointer',
  },
  manageExamsContainer: {
    marginTop: '2rem',
  },
  manageExamsButton: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#9333ea',
    color: '#fff',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: 'none',
    cursor: 'pointer',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  messageError: {
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  messageSuccess: {
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  contentTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#374151',
  },
  contentSubtitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginTop: '1.5rem',
    marginBottom: '1rem',
    color: '#4b5563',
  },
  dashboardText: {
    fontSize: '1.125rem',
    color: '#4b5563',
    marginBottom: '1rem',
  },
  dashboardList: {
    listStyleType: 'disc',
    listStylePosition: 'inside',
    marginBottom: '1.5rem',
    fontSize: '1.25rem',
    fontWeight: '500',
    lineHeight: '1.75rem',
  },
  dashboardListItem: {
    color: '#2563eb',
  },
  expirationReminderBox: {
    backgroundColor: '#fffbe0', // Light yellow background
    border: '1px solid #fde047', // Yellow border
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  expirationReminderTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#b45309', // Dark orange text
    marginBottom: '0.75rem',
    textAlign: 'center',
  },
  expirationReminderList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
  expirationReminderItem: {
    fontSize: '1rem',
    color: '#713f12', // Brownish text
    marginBottom: '0.5rem',
  },
  expirationCourseName: {
    fontWeight: 'bold',
    color: '#d97706', // Orange
  },
  expirationDays: {
    fontWeight: 'bold',
    color: '#dc2626', // Red for urgency
  },
  expirationCallToAction: {
    fontSize: '0.9rem',
    color: '#713f12',
    marginTop: '1rem',
    textAlign: 'center',
  },
  videoPlayerContainer: {
    marginBottom: '1.5rem',
  },
  backButton: {
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#d1d5db',
    color: '#374151',
    borderRadius: '0.5rem',
    transition: 'background-color 0.3s ease',
    border: 'none',
    cursor: 'pointer',
  },
  videoPlayer: {
    width: '100%',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    aspectRatio: '16 / 9',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    transition: 'box-shadow 0.3s ease',
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1d4ed8',
    margin: 0,
  },
  cardDescription: {
    fontSize: '0.875rem',
    color: '#4b5563',
    marginTop: '0.25rem',
  },
  videoCategoryTag: {
    display: 'inline-block',
    marginTop: '0.75rem',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#22c55e',
    borderRadius: '9999px',
  },
  quizCategoryTag: {
    display: 'inline-block',
    marginTop: '0.75rem',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#8b5cf6',
    borderRadius: '9999px',
  },
  assignmentCategoryTag: {
    display: 'inline-block',
    marginTop: '0.75rem',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#f59e0b',
    borderRadius: '9999px',
  },
  noContentMessage: {
    gridColumn: '1 / -1',
    color: '#4b5563',
  },
  quizActiveContainer: {
    padding: '1.5rem',
    backgroundColor: '#fff',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  quizTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1d4ed8',
  },
  questionProgress: {
    fontSize: '1.125rem',
    fontWeight: '500',
    marginBottom: '1rem',
  },
  questionText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  optionButton: {
    width: '100%',
    textAlign: 'left',
    padding: '0.75rem 1.25rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    backgroundColor: '#f9fafb',
    transition: 'all 0.3s ease',
    fontSize: '1.125rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  quizCompletedContainer: {
    padding: '1.5rem',
    backgroundColor: '#fff',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  quizCompletedTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1d4ed8',
  },
  quizScore: {
    fontSize: '1.25rem',
    marginBottom: '1.5rem',
  },
  quizActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  backToQuizzesButton: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#d1d5db',
    color: '#374151',
    borderRadius: '0.5rem',
    transition: 'background-color 0.3s ease',
    fontSize: '1.125rem',
    border: 'none',
    cursor: 'pointer',
  },
  retakeQuizButton: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: '0.5rem',
    transition: 'background-color 0.3s ease',
    fontSize: '1.125rem',
    border: 'none',
    cursor: 'pointer',
  },
  yourAnswersContainer: {
    marginTop: '2rem',
    textAlign: 'left',
  },
  yourAnswersTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#374151',
  },
  answerReviewCard: {
    marginBottom: '1rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  answerQuestion: {
    fontWeight: '600',
    color: '#374151',
  },
  answerCorrect: {
    fontSize: '0.875rem',
    marginTop: '0.25rem',
    color: '#16a34a',
  },
  answerIncorrect: {
    fontSize: '0.875rem',
    marginTop: '0.25rem',
    color: '#dc2626',
  },
  answerText: {
    fontWeight: '500',
  },
  correctAnswerText: {
    display: 'block',
    marginTop: '0.25rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 50,
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textAlign: 'center',
    maxWidth: '24rem',
    width: '100%',
    border: '1px solid #d1d5db',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#374151',
  },
  modalText: {
    color: '#4b5563',
    marginBottom: '1.5rem',
  },
  modalButtonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  modalCancelButton: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#d1d5db',
    color: '#374151',
    borderRadius: '0.5rem',
    transition: 'background-color 0.3s ease',
    border: 'none',
    cursor: 'pointer',
  },
  modalConfirmButton: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    borderRadius: '0.5rem',
    transition: 'background-color 0.3s ease',
    border: 'none',
    cursor: 'pointer',
  },
  fullScreenCenter: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontFamily: 'Inter',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  authCard: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    maxWidth: '32rem',
    width: '100%',
    textAlign: 'center',
  },
  authTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#1d4ed8',
  },
  authText: {
    color: '#4b5563',
    marginBottom: '1.5rem',
  },
  authInput: {
    width: 'calc(100% - 2rem)',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '1rem',
  },
  authButtonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  authButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  toggleAuthViewButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: '#2563eb',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  guestButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
  },
  registrationCard: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    maxWidth: '32rem',
    width: '100%',
    textAlign: 'center',
  },
  registrationTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#1d4ed8',
  },
  registrationText: {
    color: '#4b5563',
    marginBottom: '2rem',
  },
  examSelectionContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap', // Allow wrapping of exam buttons
  },
  examButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    cursor: 'pointer',
  },
  examButtonSelected: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#6366f1',
    color: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: 'none',
    cursor: 'pointer',
  },
  startButton: {
    width: '100%',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    backgroundColor: '#16a34a',
    color: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: 'none',
    cursor: 'pointer',
  },
  startButtonDisabled: {
    width: '100%',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    backgroundColor: '#d1d5db',
    color: '#6b7280',
    cursor: 'not-allowed',
    border: 'none',
  },
  contentTabs: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #e5e7eb',
    flexWrap: 'wrap', // Allow tabs to wrap on small screens
  },
  contentTab: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem', // Smaller font for mobile
    fontWeight: '500',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  contentTabSelected: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem', // Smaller font for mobile
    fontWeight: '600',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #3b82f6',
    color: '#3b82f6',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default App;
