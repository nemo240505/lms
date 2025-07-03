import React, { useState, useEffect, useRef } from 'react';
// import { createClient } from '@supabase/supabase-js'; // This import is replaced by CDN loading

// --- Supabase Configuration (REPLACE THESE WITH YOUR ACTUAL SUPABASE PROJECT DETAILS) ---
// IMPORTANT: Ensure these match your Supabase Project URL and Anon Public Key EXACTLY.
// You can find these in your Supabase Dashboard under Settings -> API.
// If you are seeing "TypeError: Failed to fetch", it is highly likely these values are incorrect or your Supabase project is not set up.
const SUPABASE_URL = 'https://gawllbktmwswzmvzzpmq.supabase.co'; // Ensure this is EXACTLY correct
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhd2xsYmt0bXdzd3ptdnp6cG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Nzc4MTksImV4cCI6MjA2NzE1MzgxOX0.HhDaRGuzP_eyFyrM3ABz29LPkseCEGrQcHZNcjWZazI';

// Initialize supabase client outside the component to ensure it's a singleton
// and can be accessed within useEffect cleanup for subscriptions.
let supabase = null; 
let supabaseAuthSubscription = null; // To hold the auth subscription object for cleanup

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
  { id: 'v14_ielts_reading_d3', title: 'IELTS Reading - Day 3 True/False/Not Given', description: 'Strategies for detail questions.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', category: 'IELTS', module: 'Reading', day: 'Day 2' },
  
  // IELTS Writing (3 days)
  { id: 'v15_ielts_writing_d1', title: 'IELTS Writing - Day 1 Intro', description: 'Task 1 & Task 2 Overview.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', category: 'IELTS', module: 'Writing', day: 'Day 1' },
  { id: 'v16_ielts_writing_d1_t1', title: 'IELTS Writing - Day 1 Task 1 Report Writing', description: 'Analyzing charts and graphs.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', category: 'IELTS', module: 'Writing', day: 'Day 1' },
  { id: 'v17_ielts_writing_d2', title: 'IELTS Writing - Day 2 Essay Structure', description: 'Structuring your argumentative essay.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', category: 'IELTS', module: 'Writing', day: 'Day 2' },
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
  { id: 'a22_pt_reading_d1', title: 'PTE Reading Multiple choice, multiple answers.', category: 'PT', module: 'Reading', day: 'Day 1' },
  { id: 'a23_pt_reading_d2', title: 'PTE Reading Highlight correct summary.', category: 'PT', module: 'Reading', day: 'Day 2' },
  { id: 'a24_pt_listening_d1', title: 'PTE Listening Fill in the blanks from audio.', category: 'PT', module: 'Listening', day: 'Day 1' },
  { id: 'a25_pt_listening_d2', title: 'PTE Listening Select missing word.', category: 'PT', module: 'Listening', day: 'Day 2' },

  // SAT Assignments (2 days per module)
  { id: 'a26_sat_math_d1', title: 'SAT Math Day 1 Assignment', description: 'Solve practice problems: Heart of Algebra.', category: 'SAT', module: 'Math', day: 'Day 1' },
  { id: 'a27_sat_math_d2', title: 'SAT Math Day 2 Assignment', 'description': 'Solve practice problems: Passport to Advanced Math.', category: 'SAT', module: 'Math', day: 'Day 2' },
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
  { id: 'w26_sat_writing_d1', title: 'SAT Writing Grammar Rules', description: 'Grammar cheat sheet.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'SAT', module: 'Writing', day: 'Day 1' },
  { id: 'w27_sat_writing_d2', title: 'SAT Writing Essay Prompts.', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'SAT', module: 'Writing', day: 'Day 2' },
];


const App = () => {
  // Auth specific states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Corrected: was missing useState
  const [fullName, setFullName] = useState(''); 
  const [isLoginView, setIsLoginView] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false); 
  const [newPassword, setNewPassword] = useState('');
  const [currentPasswordForReauth, setCurrentPasswordForReauth] = useState(''); 

  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null); 
  const [isSupabaseClientReady, setIsSupabaseClientReady] = useState(false); // New state for client readiness
  const [isAuthDataLoaded, setIsAuthDataLoaded] = useState(false); // New state for auth listener completion
  const [appState, setAppState] = useState('loading');
  const [filterCategory, setFilterCategory] = useState('All'); 
  const [filterModule, setFilterModule] = useState('All');
  const [filterDay, setFilterDay] = useState('All');
  const [contentTab, setContentTab] = useState('videos');
  const [isAdmin, setIsAdmin] = useState(false); 

  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [worksheets, setWorksheets] = useState([]); 

  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [message, setMessage] = useState('');
  const [quizResults, setQuizResults] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [registeredExams, setRegisteredExams] = useState([]); 
  const [selectedExamsForRegistration, setSelectedExamsForRegistration] = useState([]); 

  // States for adding new content (Admin specific)
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoFile, setNewVideoFile] = useState(null); // For file uploads
  const [newVideoCategory, setNewVideoCategory] = useState('IELTS'); 
  const [newVideoModule, setNewVideoModule] = useState('Listening'); 
  const [newVideoDay, setNewVideoDay] = useState('Day 1'); 

  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizCategory, setNewQuizCategory] = useState('IELTS');
  const [newQuizModule, setNewQuizModule] = useState('Listening');
  const [newQuizDay, setNewQuizDay] = useState('Day 1');
  const [newQuizQuestions, setNewQuizQuestions] = useState([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);

  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDescription, setNewAssignmentDescription] = useState('');
  const [newAssignmentCategory, setNewAssignmentCategory] = useState('IELTS');
  const [newAssignmentModule, setNewAssignmentModule] = useState('Listening');
  const [newAssignmentDay, setNewAssignmentDay] = useState('Day 1');

  // Add this console log to see app state on every render - Moved after useState declarations
  console.log("App component rendered. Current appState:", appState, "isAdmin:", isAdmin, "userId:", userId);

  // Supabase tables (no need for refs, directly use string names)
  const USER_PROFILES_TABLE = 'user_profiles';
  const VIDEOS_TABLE = 'videos';
  const QUIZZES_TABLE = 'quizzes';
  const ASSIGNMENTS_TABLE = 'assignments';
  const WORKSHEETS_TABLE = 'worksheets';
  const USER_SCORES_TABLE = 'user_scores';
  const VIDEO_STORAGE_BUCKET = 'studyprep-videos'; // Supabase Storage Bucket name

  // Function to add sample data to Supabase if tables are empty
  const addSampleDataToSupabase = async (tableName, placeholderData) => {
      try {
          console.log(`Checking '${tableName}' for existing data...`);
          const { count, error: countError } = await supabase
              .from(tableName)
              .select('count()', { head: true }); // Check if any rows exist

          if (countError) {
              console.error(`Supabase count error for '${tableName}':`, countError.message, countError.details, countError.hint);
              throw countError;
          }

          if (count === 0) {
              console.log(`Adding placeholder data to '${tableName}'...`);
              const { error: insertError } = await supabase
                  .from(tableName)
                  .insert(placeholderData);
              if (insertError) {
                  console.error(`Supabase insert error for '${tableName}':`, insertError.message, insertError.details, insertError.hint);
                  throw insertError;
              }
              console.log(`Placeholder data added to '${tableName}'.`);
          } else {
              console.log(`'${tableName}' already contains data. Skipping sample data insertion.`);
          }
      } catch (error) {
          console.error(`Error managing sample data for '${tableName}':`, error.message, error);
          // Do NOT set message here as it might overwrite more critical messages from auth
          // setMessage(`Error populating sample data for ${tableName}: ${error.message}`);
      }
  };

  const fetchContent = async () => {
      try {
          console.log("Fetching content from Supabase...");
          
          await addSampleDataToSupabase(VIDEOS_TABLE, placeholderVideos);
          await addSampleDataToSupabase(QUIZZES_TABLE, sampleQuizzes);
          await addSampleDataToSupabase(ASSIGNMENTS_TABLE, placeholderAssignments);
          await addSampleDataToSupabase(WORKSHEETS_TABLE, placeholderWorksheets);

          const { data: videosData, error: videosError } = await supabase.from(VIDEOS_TABLE).select('*');
          if (videosError) {
              console.error("Supabase videos fetch error:", videosError.message, videosError.details, videosError.hint);
              throw videosError;
          }
          setVideos(videosData);
          console.log("Videos fetched. Count:", videosData.length);

          const { data: quizzesData, error: quizzesError } = await supabase.from(QUIZZES_TABLE).select('*');
          if (quizzesError) {
              console.error("Supabase quizzes fetch error:", quizzesError.message, quizzesError.details, quizzesError.hint);
              throw quizzesError;
          }
          setQuizzes(quizzesData);
          console.log("Quizzes fetched. Count:", quizzesData.length);

          const { data: assignmentsData, error: assignmentsError } = await supabase.from(ASSIGNMENTS_TABLE).select('*');
          if (assignmentsError) {
              console.error("Supabase assignments fetch error:", assignmentsError.message, assignmentsError.details, assignmentsError.hint);
              throw assignmentsError;
          }
          setAssignments(assignmentsData);
          console.log("Assignments fetched. Count:", assignmentsData.length);

          const { data: worksheetsData, error: worksheetsError } = await supabase.from(WORKSHEETS_TABLE).select('*');
          if (worksheetsError) {
              console.error("Supabase worksheets fetch error:", worksheetsError.message, worksheetsError.details, worksheetsError.hint);
              throw worksheetsError;
          }
          setWorksheets(worksheetsData);
          console.log("Worksheets fetched. Count:", worksheetsData.length);

      } catch (error) {
          console.error("Error fetching content from Supabase:", error);
          setMessage(`Error loading content: ${error.message}. Check Supabase credentials and RLS policies.`);
      }
  };

  // Effect 1: Load Supabase script and initialize client once.
  useEffect(() => {
    console.log("1. useEffect for Supabase script load triggered.");
    
    const loadSupabaseScript = () => {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized from global object.");
        console.log("Supabase URL:", SUPABASE_URL);
        console.log("Supabase Anon Key (first 5 chars):", SUPABASE_ANON_KEY.substring(0, 5) + '...');
        // --- RESTORED WARNING CONDITION HERE ---
        if (SUPABASE_URL === 'https://ummnkynnwlkmzacycupc.supabase.co' || SUPABASE_ANON_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbW5reW5ubHdrbXphY3ljdXBj')) {
          console.warn("WARNING: Supabase URL or Anon Key are still default placeholders. Please replace them with your actual Supabase project credentials for the app to function correctly.");
          setMessage("WARNING: Supabase credentials are placeholders. Update them in App.js.");
        }
        // --- END RESTORED WARNING CONDITION ---
        setIsSupabaseClientReady(true);
      } else {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
        script.async = true;
        script.onload = () => {
          if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase client initialized after script load.");
            console.log("Supabase URL:", SUPABASE_URL);
            console.log("Supabase Anon Key (first 5 chars):", SUPABASE_ANON_KEY.substring(0, 5) + '...');
            // --- RESTORED WARNING CONDITION HERE ---
            if (SUPABASE_URL === 'https://ummnkynnwlkmzacycupc.supabase.co' || SUPABASE_ANON_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbW5reW5ubHdrbXphY3ljdXBj')) {
              console.warn("WARNING: Supabase URL or Anon Key are still default placeholders. Please replace them with your actual Supabase project credentials for the app to function correctly.");
              setMessage("WARNING: Supabase credentials are placeholders. Update them in App.js.");
            }
            // --- END RESTORED WARNING CONDITION ---
            setIsSupabaseClientReady(true);
          } else {
            console.error("Supabase createClient not found on window object after script load.");
            setMessage("App initialization failed: Supabase client not found.");
            setIsSupabaseClientReady(true); // Still set to true to unblock loading, but indicate error
            setAppState('auth_email_password');
          }
        };
        script.onerror = (e) => {
          console.error("Failed to load Supabase script from CDN.", e);
          setMessage("App initialization failed: Could not load Supabase library. Check your internet connection or CDN access.");
          setIsSupabaseClientReady(true); // Still set to true to unblock loading, but indicate error
          setAppState('auth_email_password');
        };
        document.head.appendChild(script);
      }
    };

    loadSupabaseScript();
    
    // No cleanup for script itself, it's a global dependency.
    // Auth subscription cleanup will be in the next useEffect.
  }, []); // Runs once on mount


  // Effect 2: Attach Auth listener once Supabase client is ready.
  useEffect(() => {
    console.log("2. useEffect for Auth Listener triggered. isSupabaseClientReady:", isSupabaseClientReady);
    if (!isSupabaseClientReady) {
      return; // Wait until Supabase client is definitely ready
    }

    if (!supabase || !supabase.auth || !supabase.from) {
      console.error("Supabase client is not properly initialized for auth listener. Check SUPABASE_URL and SUPABASE_ANON_KEY.");
      setMessage("App initialization failed: Supabase client not ready. Ensure URL and Key are set.");
      setAppState('auth_email_password');
      setIsAuthDataLoaded(true); // Unblock app even if auth setup fails
      return;
    }

    // Supabase Auth Listener
    // Store the subscription in the global variable for cleanup
    supabaseAuthSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("3. Auth listener received event:", event, "Session:", session);
      if (session) {
        const user = session.user;
        setUserId(user.id);

        try {
          console.log("Attempting to get user profile from Supabase for ID:", user.id);
          const { data: profileData, error: profileError } = await supabase
            .from(USER_PROFILES_TABLE)
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means "No rows found"
            console.error("Error fetching user profile:", profileError.message, profileError.details, profileError.hint);
            setMessage(`Error loading user profile: ${profileError.message}`);
            // If profile fails to load, but user is authenticated, keep them on login to resolve
            setAppState('auth_email_password');
            setIsAuthDataLoaded(true); // Ensure loading state is cleared
            return;
          }

          let currentIsAdmin = false;
          let currentUserName = user.email;
          let currentRegisteredExams = [];

          if (profileData) {
            console.log("User profile data from Supabase:", profileData);
            currentIsAdmin = profileData.is_admin || false; // This line is crucial
            // --- NEW LOG HERE ---
            console.log("DEBUG: is_admin from Supabase profile:", profileData.is_admin, "-> setting isAdmin state to:", currentIsAdmin); 
            // --- END NEW LOG ---
            currentUserName = profileData.full_name || user.email;

            const effectiveCreationDate = (profileData.created_at && !isNaN(new Date(profileData.created_at)))
              ? profileData.created_at
              : new Date().toISOString(); 
            
            currentRegisteredExams = (profileData.registered_exams || []).map(exam => {
              if (typeof exam === 'string') {
                return { name: exam, expiration: new Date(Date.parse(effectiveCreationDate) + 90 * 24 * 60 * 60 * 1000).toISOString() };
              }
              return exam;
            });
            console.log("Processed registeredExams:", currentRegisteredExams);

          } else {
            // New user profile: create with default isAdmin: false, empty exams, and provided fullName
            const newProfileCreatedAt = new Date().toISOString();
            console.log("User profile does not exist in DB. Creating new profile for UID:", user.id);
            const { error: insertError } = await supabase
              .from(USER_PROFILES_TABLE)
              .insert({ 
                id: user.id,
                full_name: fullName || user.email,
                is_admin: false, // Explicitly set to false here for new sign-ups
                created_at: newProfileCreatedAt, 
                registered_exams: []
              });
            
            if (insertError) {
              console.error("Error creating new user profile:", insertError.message, insertError.details, insertError.hint);
              setMessage(`Error creating profile: ${insertError.message}`);
              setAppState('auth_email_password');
              setIsAuthDataLoaded(true); // Ensure loading state is cleared
              return;
            }
            currentIsAdmin = false; // This line is also crucial
            console.log("Value of is_admin for new profile (default false):", currentIsAdmin); // NEW LOG
            currentUserName = fullName || user.email;
            currentRegisteredExams = [];
            console.log("New user profile created.");
          }
          
          // Set all states AFTER fetching and processing profile data
          setIsAdmin(currentIsAdmin); // This sets the state
          setUserName(currentUserName);
          setRegisteredExams(currentRegisteredExams);
          setSelectedExamsForRegistration(currentRegisteredExams.map(e => e.name)); 
          console.log(`isAdmin state set to: ${currentIsAdmin} for user: ${currentUserName}`);

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
          setIsAuthDataLoaded(true); // Auth and profile data are now loaded
          console.log("isAuthDataLoaded set to true.");

          // --- IMPORTANT CHANGE: Call fetchContent here after auth is fully processed ---
          await fetchContent(); // Fetch content only after user is authenticated and profile loaded

        } catch (dbError) {
          console.error("Supabase DB operation error in onAuthStateChange:", dbError);
          setMessage(`Database error: ${dbError.message}`);
          setAppState('auth_email_password');
          setIsAuthDataLoaded(true); // Ensure loading state is cleared even on error
        }

      } else {
        console.log("Auth listener: No user session detected. User is logged out.");
        setUserId(null);
        setUserName(null);
        setRegisteredExams([]);
        setSelectedExamsForRegistration([]);
        setIsAdmin(false); // This should set isAdmin to false
        setAppState('auth_email_password');
        setIsAuthDataLoaded(true); // Auth data (or lack thereof) is loaded
        console.log("Auth listener: States reset. isAdmin is now:", false, "appState is now:", 'auth_email_password');
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      console.log("Cleaning up Supabase auth subscription.");
      if (supabaseAuthSubscription) {
          supabaseAuthSubscription.unsubscribe();
      }
    };
  }, [isSupabaseClientReady]); // CHANGED: Removed fullName from dependency array


  // NEW EFFECT: Add Cache-Control meta tags to prevent aggressive browser caching
  useEffect(() => {
    // Check if meta tags already exist to prevent duplicates
    const existingCacheControl = document.querySelector('meta[http-equiv="Cache-Control"]');
    const existingPragma = document.querySelector('meta[http-equiv="Pragma"]');
    const existingExpires = document.querySelector('meta[http-equiv="Expires"]');

    if (!existingCacheControl) {
      const metaCacheControl = document.createElement('meta');
      metaCacheControl.setAttribute('http-equiv', 'Cache-Control');
      metaCacheControl.setAttribute('content', 'no-cache, no-store, must-revalidate');
      document.head.appendChild(metaCacheControl);
    }
    if (!existingPragma) {
      const metaPragma = document.createElement('meta');
      metaPragma.setAttribute('http-equiv', 'Pragma');
      metaPragma.setAttribute('content', 'no-cache');
      document.head.appendChild(metaPragma);
    }
    if (!existingExpires) {
      const metaExpires = document.createElement('meta');
      metaExpires.setAttribute('http-equiv', 'Expires');
      metaExpires.setAttribute('content', '0');
      document.head.appendChild(metaExpires);
    }

    // Cleanup function to remove the meta tags if the component unmounts
    // (though for a root App component, this is less critical)
    return () => {
      const cacheControl = document.querySelector('meta[http-equiv="Cache-Control"]');
      const pragma = document.querySelector('meta[http-equiv="Pragma"]');
      const expires = document.querySelector('meta[http-equiv="Expires"]');
      if (cacheControl) document.head.removeChild(cacheControl);
      if (pragma) document.head.removeChild(pragma);
      if (expires) document.head.removeChild(expires);
    };
  }, []); // Empty dependency array means this runs once on mount


  // --- REMOVED EFFECT 3: Content loading is now handled directly within Effect 2's onAuthStateChange callback ---
  // useEffect(() => {
  //   console.log("4. Content loading useEffect triggered. isAuthDataLoaded:", isAuthDataLoaded, "userId:", userId);
  //   if (!isAuthDataLoaded) {
  //       console.log("Skipping content load: Auth data not loaded yet.");
  //       return;
  //   }
  //   if (!supabase) {
  //       console.warn("Supabase client not available for content load.");
  //       setMessage("Content loading failed: Supabase client not initialized.");
  //       return; // Should not happen if isAuthDataLoaded is true, but good safeguard
  //   }
  //   fetchContent();
  // }, [isAuthDataLoaded, userId]); // Depend on auth data being loaded and userId


  // Authentication functions (Email/Password) - Now using Supabase Auth
  const handleEmailRegister = async () => {
    setMessage('');
    if (!email || !password || !fullName) { 
      setMessage('Please enter your full name, email, and password.');
      return;
    }
    if (password.length < 6) {
        setMessage('Password must be at least 6 characters long.');
        return;
    }
    if (!supabase) { // Use the global supabase client directly
      setMessage('Supabase client not ready. Please try again.');
      console.error("Supabase client not available for registration.");
      return;
    }
    try {
      console.log("Attempting to register user with email via Supabase:", email);
      // Supabase's signUp will automatically insert into auth.users.
      // The onAuthStateChange listener will then handle creating the profile in public.user_profiles
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { // This data goes into the auth.users metadata
            full_name: fullName 
          }
        }
      });

      if (error) {
        console.error("Error during Supabase registration:", error.message, error.details, error.hint);
        setMessage(`Registration error: ${error.message}`);
        return;
      }
      
      console.log("User registered successfully via Supabase:", data.user?.id);
      setMessage('Registration successful! Please check your email to confirm your account (if email confirmation is enabled in Supabase settings).');
    } catch (error) {
      console.error("Unexpected error during Supabase registration:", error);
      setMessage(`Registration error: ${error.message}`);
    }
  };

  const handleEmailLogin = async () => {
    setMessage('');
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      return;
    }
    if (!supabase) {
      setMessage('Supabase client not ready. Please try again.');
      console.error("Supabase client not available for login.");
      return;
    }
    try {
      console.log("Attempting to log in user with email via Supabase:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("Error during Supabase login:", error.message, error.details, error.hint);
        setMessage('Login error: Invalid email or password.');
        return;
      }
      
      console.log("User logged in successfully via Supabase:", data.user?.id);
      setMessage('Login successful! Redirecting...');
    } catch (error) {
      console.error("Unexpected error during Supabase login:", error);
      setMessage(`Login error: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    setMessage(''); // Clear any previous messages
    if (!supabase) {
      setMessage('Supabase client not ready. Please try again.');
      console.error("Logout failed: Supabase client not available.");
      return;
    }
    try {
      console.log("Attempting to log out user via Supabase.");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during Supabase logout:", error.message, error.details, error.hint);
        setMessage(`Logout error: ${error.message}`);
        return;
      }
      console.log("User logged out successfully via Supabase.");
      setMessage('You have been logged out.');
      // Reset state for unauthenticated user
      setUserId(null);
      setUserName(null); 
      setRegisteredExams([]);
      setSelectedExamsForRegistration([]);
      setIsAdmin(false); 
      setAppState('auth_email_password');
      setEmail(''); 
      setPassword('');
      setFullName(''); 
      console.log("Logout: Local states reset.");
    } catch (error) {
      console.error("Unexpected error during Supabase logout:", error);
      setMessage(`Logout error: ${error.message}`);
    }
  };

  const handleChangePassword = async () => {
    setMessage('');
    if (!newPassword || !currentPasswordForReauth) {
      setMessage('Please enter both current and new password.');
      return;
    }
    if (!userId) {
      setMessage('No user is logged in.');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('New password should be at least 6 characters.');
      return;
    }
    if (!supabase) {
      setMessage('Supabase client not ready. Please try again.');
      return;
    }

    try {
      console.log("Attempting to change password via Supabase for user ID:", userId);
      // Supabase's updateUser handles reauthentication implicitly.
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error("Error changing password via Supabase:", error.message, error.details, error.hint);
        setMessage(`Error changing password: ${error.message}`);
        return;
      }
      
      console.log("Password updated successfully via Supabase.");
      setMessage('Password updated successfully!');
      setNewPassword('');
      setCurrentPasswordForReauth('');
      setShowChangePasswordModal(false);
    } catch (error) {
      console.error("Unexpected error during Supabase password change:", error);
      setMessage(`Error changing password: ${error.message}`);
    }
  };


  const handleVideoSelect = (url) => {
    setSelectedVideoUrl(url);
    setCurrentQuiz(null); 
    setContentTab('videos');
  };

  const startQuiz = (quiz) => {
    setSelectedVideoUrl(null); 
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
    if (!userId || !currentQuiz || !supabase) {
      console.error("Cannot save score: User not ready, quiz not selected, or Supabase not ready.");
      setMessage('Error: Cannot save score. Please try again.');
      return;
    }

    try {
      console.log("Attempting to save quiz score to Supabase...");
      const { error } = await supabase
        .from(USER_SCORES_TABLE)
        .insert({
          user_id: userId,
          quiz_id: currentQuiz.id,
          quiz_title: currentQuiz.title,
          score: quizScore,
          total_questions: currentQuiz.questions.length,
          timestamp: new Date().toISOString(),
        });
      if (error) {
        console.error("Error saving quiz score:", error.message, error.details, error.hint);
        throw error;
      }
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

  const toggleExamRegistration = (exam) => {
    setSelectedExamsForRegistration(prev =>
      prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]
    );
  };

  const handleRegisterExams = async () => {
    setMessage('');
    if (!userId) {
      setMessage('System error: User not authenticated.');
      console.error("handleRegisterExams: User not authenticated.");
      return;
    }
    if (selectedExamsForRegistration.length === 0) {
      setMessage('Please select at least one exam to register.');
      return;
    }
    if (!supabase) {
      setMessage('Supabase client not ready. Please try again.');
      return;
    }

    try {
      console.log("Attempting to register exams for user:", userId);
      const examsToSave = selectedExamsForRegistration.map(examName => {
        const existingExam = registeredExams.find(e => e.name === examName);
        if (existingExam && existingExam.expiration && !isNaN(new Date(existingExam.expiration).getTime())) {
          console.log(`Preserving existing expiration for ${examName}:`, existingExam.expiration);
          return existingExam;
        }
        const newExpirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        console.log(`Setting new expiration for ${examName}:`, newExpirationDate);
        return { name: examName, expiration: newExpirationDate };
      });

      const { error } = await supabase
        .from(USER_PROFILES_TABLE)
        .update({ 
          registered_exams: examsToSave, // Update the JSONB column
          last_updated: new Date().toISOString()
        })
        .eq('id', userId); // Update for the specific user ID

      if (error) {
        console.error("Error registering exams:", error.message, error.details, error.hint);
        throw error;
      }
      
      setRegisteredExams(examsToSave);
      setMessage('Registration successful! Redirecting...');
      console.log("Exams registered/updated successfully:", examsToSave);
      
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
    if (!newVideoTitle || !newVideoCategory || !newVideoModule || !newVideoDay || (!newVideoUrl && !newVideoFile)) {
      setMessage('Please fill all required video fields and provide either a URL or a file.');
      return;
    }
    if (!userId) {
      setMessage('User not authenticated. Cannot add video.');
      return;
    }
    if (!isAdmin) { // Only admins can add content
      setMessage('Access denied. Only administrators can add videos.');
      return;
    }
    if (!supabase) {
      setMessage('Supabase client not ready. Please try again.');
      return;
    }

    let video_url_to_save = newVideoUrl;

    if (newVideoFile) {
        try {
            console.log("Uploading video file to Supabase Storage...");
            const fileExtension = newVideoFile.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExtension}`;
            const filePath = `${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(VIDEO_STORAGE_BUCKET)
                .upload(filePath, newVideoFile, {
                    cacheControl: '3600',
                    upsert: false // Set to true if you want to allow overwrites
                });

            if (uploadError) {
              console.error("Error uploading video file to Supabase Storage:", uploadError.message, uploadError.details, uploadError.hint);
              throw uploadError;
            }
            console.log("Video uploaded to storage:", uploadData);

            // Get public URL of the uploaded file
            const { data: publicUrlData } = supabase.storage
                .from(VIDEO_STORAGE_BUCKET)
                .getPublicUrl(filePath);
            
            if (!publicUrlData || !publicUrlData.publicUrl) throw new Error("Could not get public URL for uploaded video.");
            video_url_to_save = publicUrlData.publicUrl;
            setMessage('Video file uploaded successfully!');

        } catch (error) {
            console.error("Error uploading video file to Supabase Storage:", error);
            setMessage(`Error uploading video file: ${error.message}`);
            return; // Stop if file upload fails
        }
    } else if (!newVideoUrl) {
      setMessage('Please provide a video URL or upload a file.');
      return;
    }

    try {
      console.log("Attempting to add new video to Supabase DB:", video_url_to_save);
      const { error } = await supabase
        .from(VIDEOS_TABLE)
        .insert({
          id: `vid_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Generate unique ID
          title: newVideoTitle,
          description: newVideoDescription,
          url: video_url_to_save,
          category: newVideoCategory,
          module: newVideoModule,
          day: newVideoDay,
          timestamp: new Date().toISOString(),
          added_by: userId,
        });
      
      if (error) {
        console.error("Error adding video record to Supabase DB:", error.message, error.details, error.hint);
        throw error;
      }

      console.log("Video record added successfully to DB.");
      setMessage('Video added successfully!');
      // Clear form fields
      setNewVideoTitle('');
      setNewVideoDescription('');
      setNewVideoUrl('');
      setNewVideoFile(null);
    } catch (error) {
      console.error("Error adding video record to Supabase DB:", error);
      setMessage(`Error adding video record: ${error.message}`);
    }
  };

  const handleAddQuiz = async () => {
    setMessage('');
    if (!newQuizTitle || !newQuizDescription || !newQuizCategory || !newQuizModule || !newQuizDay) {
      setMessage('Please fill all quiz details.');
      return;
    }
    if (newQuizQuestions.length === 0 || newQuizQuestions.some(q => !q.questionText || q.options.some(opt => !opt) || !q.correctAnswer)) {
      setMessage('Please ensure all quiz questions have text, options, and a correct answer.');
      return;
    }
    if (!userId) {
      setMessage('User not authenticated. Cannot add quiz.');
      return;
    }
    if (!isAdmin) { // Only admins can add content
      setMessage('Access denied. Only administrators can add quizzes.');
      return;
    }
    if (!supabase) {
      setMessage('Supabase client not ready. Please try again.');
      return;
    }

    try {
      console.log("Attempting to add new quiz to Supabase.");
      const { error } = await supabase
        .from(QUIZZES_TABLE)
        .insert({
          id: `quiz_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: newQuizTitle,
          description: newQuizDescription,
          category: newQuizCategory,
          module: newQuizModule,
          day: newQuizDay,
          questions: newQuizQuestions, // Supabase handles JSONB directly
          timestamp: new Date().toISOString(),
          added_by: userId,
        });
      
      if (error) {
        console.error("Error adding quiz:", error.message, error.details, error.hint);
        throw error;
      }

      console.log("Quiz added successfully.");
      setMessage('Quiz added successfully!');
      // Clear form fields
      setNewQuizTitle('');
      setNewQuizDescription('');
      setNewQuizCategory('IELTS');
      setNewQuizModule('Listening');
      setNewQuizDay('Day 1');
      setNewQuizQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
    } catch (error) {
      console.error("Error adding quiz:", error);
      setMessage(`Error adding quiz: ${error.message}`);
    }
  };

  const handleAddAssignment = async () => {
    setMessage('');
    if (!newAssignmentTitle || !newAssignmentDescription || !newAssignmentCategory || !newAssignmentModule || !newAssignmentDay) {
      setMessage('Please fill all assignment details.');
      return;
    }
    if (!userId) {
      setMessage('User not authenticated. Cannot add assignment.');
      return;
    }
    if (!isAdmin) { // Only admins can add content
      setMessage('Access denied. Only administrators can add assignments.');
      return;
    }
    if (!supabase) {
      setMessage('Supabase client not ready. Please try again.');
      return;
    }

    try {
      console.log("Attempting to add new assignment to Supabase.");
      const { error } = await supabase
        .from(ASSIGNMENTS_TABLE)
        .insert({
          id: `assign_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: newAssignmentTitle,
          description: newAssignmentDescription,
          category: newAssignmentCategory,
          module: newAssignmentModule,
          day: newAssignmentDay,
          timestamp: new Date().toISOString(),
          added_by: userId,
        });
      
      if (error) {
        console.error("Error adding assignment:", error.message, error.details, error.hint);
        throw error;
      }

      console.log("Assignment added successfully.");
      setMessage('Assignment added successfully!');
      // Clear form fields
      setNewAssignmentTitle('');
      setNewAssignmentDescription('');
      setNewAssignmentCategory('IELTS');
      setNewAssignmentModule('Listening');
      setNewAssignmentDay('Day 1');
    } catch (error) {
      console.error("Error adding assignment:", error);
      setMessage(`Error adding assignment: ${error.message}`);
    }
  };

  // Helper for Quiz Question Management
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...newQuizQuestions];
    updatedQuestions[index][field] = value;
    setNewQuizQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...newQuizQuestions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setNewQuizQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setNewQuizQuestions([...newQuizQuestions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = newQuizQuestions.filter((_, i) => i !== index);
    setNewQuizQuestions(updatedQuestions);
  };


  const goToCourseHome = (course) => {
    console.log("Navigating to course home:", course);
    setAppState(`${course.toLowerCase()}_home`);
    setFilterCategory(course); 
    setFilterModule('All'); 
    setFilterDay('All'); 
    setSelectedVideoUrl(null); 
    setCurrentQuiz(null); 
    setContentTab('videos'); 
  };


  const applyContentFilters = (contentList) => {
    // Only filter if auth data has been loaded. If not loaded, it means user is still loading or not authenticated.
    if (!isAuthDataLoaded) {
      return [];
    }
    
    let filtered = contentList.filter(item => item.category === filterCategory);

    if (filterModule !== 'All') {
      filtered = filtered.filter(item => item.module === filterModule);
    }

    if (filterDay !== 'All') {
      filtered = filtered.filter(item => item.day === filterDay);
    }

    return filtered;
  };

  const getModuleOptions = (category) => {
    switch (category) {
        case 'IELTS':
            return ['All', 'Listening', 'Reading', 'Writing', 'Speaking']; // Reordered for better UI flow
        case 'PT':
            return ['All', 'Speaking', 'Writing', 'Reading', 'Listening'];
        case 'SAT':
            return ['All', 'Math', 'Reading', 'Writing'];
        default:
            return ['All'];
    }
  };

  const getDayOptions = (currentCategory, currentModule) => {
    const category = currentCategory || filterCategory;
    const module = currentModule || filterModule;

    if (category === 'IELTS') {
      switch (module) {
        case 'Listening':
          return ['All', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8'];
        case 'Reading':
        case 'Writing':
        case 'Speaking':
          return ['All', 'Day 1', 'Day 2', 'Day 3'];
        default:
          return ['All'];
      }
    } else if (category === 'PT') {
      switch (module) {
        case 'Speaking':
        case 'Writing':
        case 'Reading':
        case 'Listening':
          return ['All', 'Day 1', 'Day 2'];
        default:
          return ['All'];
      }
    } else if (category === 'SAT') {
      switch (module) {
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
    if (!exam.expiration || isNaN(new Date(exam.expiration).getTime())) { // Use getTime() to check for valid date
      console.warn("Skipping invalid expiration date for reminder:", exam.name, exam.expiration);
      return false; 
    }
    const expirationDate = new Date(exam.expiration);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    expirationDate.setHours(0, 0, 0, 0); 

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(`Exam: ${exam.name}, Expiration: ${exam.expiration}, Current Date: ${new Date().toISOString()}, DiffDays: ${diffDays}`);
    return diffDays > 0 && diffDays <= 30; 
  }).sort((a, b) => {
    const dateA = new Date(a.expiration);
    const dateB = new Date(b.expiration);
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0; 
    if (isNaN(dateA.getTime())) return 1; 
    if (isNaN(dateB.getTime())) return -1; 
    return dateA.getTime() - dateB.getTime();
  });


  const filteredVideos = applyContentFilters(videos);
  const filteredQuizzes = applyContentFilters(quizzes);
  const filteredAssignments = applyContentFilters(assignments);
  const filteredWorksheets = applyContentFilters(worksheets); 

  // Ensure dynamic resizing of main content area (using Tailwind-like media queries via inline styles)
  useEffect(() => {
    const handleResize = () => {
      const mainElement = document.querySelector('main');
      const contentGridElements = document.querySelectorAll('.content-grid');

      if (!mainElement) {
        return;
      }

      if (window.innerWidth >= 1024) { 
        mainElement.style.flexDirection = 'row';
        contentGridElements.forEach(el => el.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))'); 
      } else if (window.innerWidth >= 768) { 
        mainElement.style.flexDirection = 'column'; 
        contentGridElements.forEach(el => el.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))');
      } else { 
        mainElement.style.flexDirection = 'column';
        contentGridElements.forEach(el => el.style.gridTemplateColumns = 'repeat(1, minmax(0, 1fr))');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render a loading state until authentication data is fully loaded
  if (!isAuthDataLoaded) {
    return (
      <div style={styles.fullScreenCenter}>
        <div style={styles.loadingMessage}>
          Loading and authenticating...
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
              onClick={() => { setIsLoginView(!isLoginView); setMessage(''); }} 
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

  // --- Admin Add Video Screen ---
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
        <div style={styles.adminFormCard}> 
          <h2 style={styles.adminFormTitle}>Add New Video</h2>
          <input
            type="text"
            placeholder="Video Title"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            style={styles.adminFormInput}
          />
          <textarea
            placeholder="Video Description"
            value={newVideoDescription}
            onChange={(e) => setNewVideoDescription(e.target.value)}
            style={{ ...styles.adminFormInput, height: '80px', resize: 'vertical' }}
          />
          <input
            type="text"
            placeholder="Video URL (e.g., https://example.com/video.mp4)"
            value={newVideoUrl}
            onChange={(e) => {setNewVideoUrl(e.target.value); setNewVideoFile(null); }} // Clear file if URL is typed
            style={styles.adminFormInput}
          />
          <div style={styles.fileUploadContainer}>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {setNewVideoFile(e.target.files[0]); setNewVideoUrl(''); }} // Clear URL if file is selected
              style={styles.fileInput}
            />
            <span style={styles.fileInputLabel}>
                {newVideoFile ? newVideoFile.name : 'Or choose a video file to upload'}
            </span>
          </div>

          <select
            value={newVideoCategory}
            onChange={(e) => {
              setNewVideoCategory(e.target.value);
              setNewVideoModule('All'); 
              setNewVideoDay('All'); 
            }}
            style={styles.adminFormInput}
          >
            <option value="IELTS">IELTS</option>
            <option value="PT">PT</option>
            <option value="SAT">SAT</option>
          </select>
          <select
            value={newVideoModule}
            onChange={(e) => {
              setNewVideoModule(e.target.value);
              setNewVideoDay('All'); 
            }}
            style={styles.adminFormInput}
          >
            {getModuleOptions(newVideoCategory).map(module => (
                <option key={module} value={module}>{module}</option>
            ))}
          </select>
          <select
            value={newVideoDay}
            onChange={(e) => setNewVideoDay(e.target.value)}
            style={styles.adminFormInput}
          >
            {getDayOptions(newVideoCategory, newVideoModule).map(day => ( 
                <option key={day} value={day}>{day}</option>
            ))}
          </select>

          <button onClick={handleAddVideo} style={styles.adminFormButton} disabled={!isAdmin || !isSupabaseClientReady}>
            Add Video
          </button>
          <button onClick={() => setAppState('admin_dashboard')} style={styles.adminFormBackButton}>
            ← Back to Admin Dashboard
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

  // --- Admin Add Quiz Screen ---
  if (appState === 'add_quiz') {
    if (!isAdmin) {
      return (
        <div style={styles.fullScreenCenter}>
          <div style={styles.authCard}>
            <h2 style={styles.authTitle}>Access Denied</h2>
            <p style={styles.authText}>You do not have administrative privileges to add quizzes.</p>
            <button onClick={() => setAppState('dashboard')} style={styles.authButton}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return (
      <div style={styles.fullScreenCenter}>
        <div style={styles.adminFormCard}>
          <h2 style={styles.adminFormTitle}>Add New Quiz</h2>
          <input
            type="text"
            placeholder="Quiz Title"
            value={newQuizTitle}
            onChange={(e) => setNewQuizTitle(e.target.value)}
            style={styles.adminFormInput}
          />
          <textarea
            placeholder="Quiz Description"
            value={newQuizDescription}
            onChange={(e) => setNewQuizDescription(e.target.value)}
            style={{ ...styles.adminFormInput, height: '80px', resize: 'vertical' }}
          />
          <select
            value={newQuizCategory}
            onChange={(e) => {
              setNewQuizCategory(e.target.value);
              setNewQuizModule('All');
              setNewQuizDay('All');
            }}
            style={styles.adminFormInput}
          >
            <option value="IELTS">IELTS</option>
            <option value="PT">PT</option>
            <option value="SAT">SAT</option>
          </select>
          <select
            value={newQuizModule}
            onChange={(e) => {
              setNewQuizModule(e.target.value);
              setNewQuizDay('All');
            }}
            style={styles.adminFormInput}
          >
            {getModuleOptions(newQuizCategory).map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
          <select
            value={newQuizDay}
            onChange={(e) => setNewQuizDay(e.target.value)}
            style={styles.adminFormInput}
          >
            {getDayOptions(newQuizCategory, newQuizModule).map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>

          <h3 style={styles.adminFormSubtitle}>Questions:</h3>
          {newQuizQuestions.map((q, qIndex) => (
            <div key={qIndex} style={styles.questionBlock}>
              <input
                type="text"
                placeholder={`Question ${qIndex + 1} Text`}
                value={q.questionText}
                onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                style={styles.adminFormInput}
              />
              <p style={styles.questionOptionsLabel}>Options:</p>
              {q.options.map((option, oIndex) => (
                <input
                  key={oIndex}
                  type="text"
                  placeholder={`Option ${oIndex + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                  style={styles.adminFormInput}
                />
              ))}
              <input
                type="text"
                placeholder="Correct Answer (must match one of the options)"
                value={q.correctAnswer}
                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                style={styles.adminFormInput}
              />
              <button onClick={() => removeQuestion(qIndex)} style={styles.removeQuestionButton}>
                Remove Question
              </button>
            </div>
          ))}
          <button onClick={addQuestion} style={styles.addQuestionButton}>
            Add Question
          </button>

          <button onClick={handleAddQuiz} style={styles.adminFormButton} disabled={!isAdmin || !isSupabaseClientReady}>
            Add Quiz
          </button>
          <button onClick={() => setAppState('admin_dashboard')} style={styles.adminFormBackButton}>
            ← Back to Admin Dashboard
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

  // --- Admin Add Assignment Screen ---
  if (appState === 'add_assignment') {
    if (!isAdmin) {
      return (
        <div style={styles.fullScreenCenter}>
          <div style={styles.authCard}>
            <h2 style={styles.authTitle}>Access Denied</h2>
                            <p style={styles.authText}>You do not have administrative privileges to add assignments.</p>
            <button onClick={() => setAppState('dashboard')} style={styles.authButton}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return (
      <div style={styles.fullScreenCenter}>
        <div style={styles.adminFormCard}>
          <h2 style={styles.adminFormTitle}>Add New Assignment</h2>
          <input
            type="text"
            placeholder="Assignment Title"
            value={newAssignmentTitle}
            onChange={(e) => setNewAssignmentTitle(e.target.value)}
            style={styles.adminFormInput}
          />
          <textarea
            placeholder="Assignment Description"
            value={newAssignmentDescription}
            onChange={(e) => setNewAssignmentDescription(e.target.value)}
            style={{ ...styles.adminFormInput, height: '80px', resize: 'vertical' }}
          />
          <select
            value={newAssignmentCategory}
            onChange={(e) => {
              setNewAssignmentCategory(e.target.value);
              setNewAssignmentModule('All');
              setNewAssignmentDay('All');
            }}
            style={styles.adminFormInput}
          >
            <option value="IELTS">IELTS</option>
            <option value="PT">PT</option>
            <option value="SAT">SAT</option>
          </select>
          <select
            value={newAssignmentModule}
            onChange={(e) => {
              setNewAssignmentModule(e.target.value);
              setNewAssignmentDay('All');
            }}
            style={styles.adminFormInput}
          >
            {getModuleOptions(newAssignmentCategory).map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
          <select
            value={newAssignmentDay}
            onChange={(e) => setNewAssignmentDay(e.target.value)}
            style={styles.adminFormInput}
          >
            {getDayOptions(newAssignmentCategory, newAssignmentModule).map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>

          <button onClick={handleAddAssignment} style={styles.adminFormButton} disabled={!isAdmin || !isSupabaseClientReady}>
            Add Assignment
          </button>
          <button onClick={() => setAppState('admin_dashboard')} style={styles.adminFormBackButton}>
            ← Back to Admin Dashboard
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

  // --- Admin Dashboard (New State) ---
  if (appState === 'admin_dashboard') {
    if (!isAdmin) {
      return (
        <div style={styles.fullScreenCenter}>
          <div style={styles.authCard}>
            <h2 style={styles.authTitle}>Access Denied</h2>
            <p style={styles.authText}>You do not have administrative privileges to access this page.</p>
            <button onClick={() => setAppState('dashboard')} style={styles.authButton}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return (
      <div style={styles.fullScreenCenter}>
        <div style={styles.adminFormCard}>
          <h2 style={styles.adminFormTitle}>Admin Dashboard</h2>
          <p style={styles.adminFormText}>Welcome, Administrator {userName}!</p>
          <div style={styles.adminDashboardButtons}>
            <button onClick={() => setAppState('add_video')} style={styles.adminDashboardButton}>
              Add New Video
            </button>
            <button onClick={() => setAppState('add_quiz')} style={styles.adminDashboardButton}>
              Add New Quiz
            </button>
            <button onClick={() => setAppState('add_assignment')} style={styles.adminDashboardButton}>
              Add New Assignment
            </button>
          </div>
          <button onClick={() => setAppState('dashboard')} style={styles.adminFormBackButton}>
            ← Back to User Dashboard
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
        <h1 style={styles.headerTitle}>StudyPrep!</h1> 
        <div style={styles.headerRight}>
          <div style={styles.userIdDisplay}>
            Welcome, {userName || 'Guest'}! {isAdmin && '(Admin)'} 
          </div>
          {/* Debugging log for isAdmin status */}
          {console.log("Rendering header. isAdmin is:", isAdmin)}
          {/* Removed Admin Toggle button */}
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
                                key={exam.name} 
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
          {filterCategory !== 'All' && filterModule !== 'All' && getDayOptions(filterCategory, filterModule).length > 1 && ( 
            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>{filterModule} Days</h3>
              <div style={styles.filterButtonsContainer}>
                {getDayOptions(filterCategory, filterModule).map(day => (
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

          {/* Admin Management Button (Admin Only) */}
          {isAdmin && (
            <div style={styles.manageExamsContainer}>
              <button
                onClick={() => setAppState('admin_dashboard')} // Navigate to new Admin Dashboard
                style={styles.manageExamsButton}
              >
                Admin Management
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
                  {contentTab === 'worksheets' && ( 
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
              style={styles.authInput} 
            />
            <input
              type="password"
              placeholder="New Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.authInput} 
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
  header: {
    background: 'linear-gradient(to right, #2563eb, #4f46e5)',
    color: '#fff',
    padding: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '0 0 0.5rem 0.5rem',
    flexWrap: 'wrap', 
  },
  headerTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    margin: 0,
    paddingRight: '1rem', 
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-end', 
    marginTop: '0.5rem', 
  },
  userIdDisplay: {
    fontSize: '0.875rem',
    fontWeight: '500',
    flexBasis: '100%', 
    textAlign: 'right', 
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
    minWidth: 'fit-content', 
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
    flexDirection: 'column', 
    gap: '1.5rem', 
  },
  sidebar: {
    width: '100%', 
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
    fontSize: '1rem', 
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%', 
  },
  navButtonSelected: {
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '1rem', 
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#3b82f6',
    color: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%', 
  },
  filterSection: {
    marginTop: '1.5rem',
  },
  filterTitle: {
    fontSize: '1.125rem', 
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
    padding: '0.4rem 0.8rem', 
    borderRadius: '9999px',
    fontSize: '0.75rem', 
    fontWeight: '500',
    transition: 'all 0.3s ease',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    cursor: 'pointer',
  },
  filterButtonSelected: {
    padding: '0.4rem 0.8rem', 
    borderRadius: '9999px',
    fontSize: '0.75rem', 
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
  successMessage: {
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
    backgroundColor: '#fffbe0', 
    border: '1px solid #fde047', 
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  expirationReminderTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#b45309', 
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
    color: '#713f12', 
    marginBottom: '0.5rem',
  },
  expirationCourseName: {
    fontWeight: 'bold',
    color: '#d97706', 
  },
  expirationDays: {
    fontWeight: 'bold',
    color: '#dc2626', 
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
    marginBottom: '1.rem',
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
    flexWrap: 'wrap', 
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
    flexWrap: 'wrap', 
  },
  contentTab: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem', 
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
    fontSize: '1rem', 
    fontWeight: '600',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #3b82f6',
    color: '#3b82f6',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  adminFormCard: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    maxWidth: '40rem', // Wider for forms
    width: '100%',
    textAlign: 'center',
  },
  adminFormTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#1d4ed8',
  },
  adminFormSubtitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginTop: '1.5rem',
    marginBottom: '1rem',
    color: '#4b5563',
    textAlign: 'left',
  },
  adminFormText: {
    color: '#4b5563',
    marginBottom: '1.5rem',
  },
  adminFormInput: {
    width: 'calc(100% - 2rem)', // Account for padding
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    display: 'block', // Ensure it takes full width
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  fileUploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    border: '1px dashed #9ca3af',
    borderRadius: '0.375rem',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none', // Hide default file input
  },
  fileInputLabel: {
    backgroundColor: '#6366f1',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  adminFormButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 'bold',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    marginTop: '1rem',
    width: '100%',
  },
  adminFormBackButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: '#2563eb',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginTop: '1rem',
  },
  questionBlock: {
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#f9fafb',
  },
  questionOptionsLabel: {
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    color: '#4b5563',
  },
  removeQuestionButton: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    marginTop: '0.5rem',
    fontSize: '0.9rem',
  },
  addQuestionButton: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '1rem',
  },
  adminDashboardButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  adminDashboardButton: {
    padding: '1rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
};

export default App;
