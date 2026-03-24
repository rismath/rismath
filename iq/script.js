let allQuestions = [];
let selectedQuestions = [];
let currentIndex = 0;
let correctAnswers = 0;

async function initQuiz() {
    try {
        // Ensure questions.json is in the same folder as index.html
        const response = await fetch('./questions.json'); 
        if (!response.ok) throw new Error("JSON not found");
        
        allQuestions = await response.json();
        
        if (allQuestions.length < 20) {
            alert("Not enough questions in JSON!");
            return;
        }

        setupQuestionSet();
        showQuestion();
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("question-text").innerText = "Error loading questions. Check console.";
    }
}

function setupQuestionSet() {
    const difficulties = ['easy', 'medium', 'hard', 'vhard'];
    selectedQuestions = [];

    // Select 5 random questions from each difficulty tier
    difficulties.forEach(diff => {
        const pool = allQuestions.filter(q => q.diff === diff);
        const shuffled = pool.sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffled.slice(0, 5));
    });

    // Final shuffle so the test doesn't go from "Easy to Hard" linearly
    selectedQuestions.sort(() => 0.5 - Math.random());
}

function showQuestion() {
    const q = selectedQuestions[currentIndex];
    const container = document.getElementById("options-container");
    
    document.getElementById("question-text").innerText = q.q;
    document.getElementById("current-index").innerText = currentIndex + 1;
    container.innerHTML = "";

    q.o.forEach(option => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = option;
        btn.onclick = () => handleAnswer(option === q.a);
        container.appendChild(btn);
    });
}

function handleAnswer(isCorrect) {
    if (isCorrect) {
        correctAnswers++;
    } else {
        // Simple "Shake" effect for wrong answers
        const container = document.getElementById("game-container");
        container.style.animation = "shake 0.2s ease-in-out";
        setTimeout(() => container.style.animation = "", 200);
    }

    if (currentIndex < 20) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById("quiz-area").style.display = "none";
    document.getElementById("result-area").style.display = "block";

    const iq = 70 + (correctAnswers * 4);
    let rank = "";

    if (iq >= 135) rank = "Mastermind";
    else if (iq >= 115) rank = "Gifted";
    else if (iq >= 95) rank = "Average Human";
    else rank = "Seeker";

    document.getElementById("score-text").innerText = `Correct: ${correctAnswers}/20`;
    document.getElementById("iq-rank").innerText = `Estimated IQ: ${iq}`;
    document.getElementById("rank-label").innerText = rank;
}

function shareResult() {
    const iq = 70 + (correctAnswers * 4);
    const url = window.location.href;
    const text = `I just scored ${iq} on the RisMath IQ Test! Can you beat me? Try here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

initQuiz();