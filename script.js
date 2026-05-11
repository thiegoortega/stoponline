const firebaseConfig = {
  apiKey: "AIzaSyD08DDmIYxtGw713tIzkGA-zu6FuqefcbU",
  authDomain: "stop-online-teste.firebaseapp.com",
  databaseURL: "https://stop-online-teste-default-rtdb.firebaseio.com",
  projectId: "stop-online-teste",
  storageBucket: "stop-online-teste.firebasestorage.app",
  messagingSenderId: "312675330360",
  appId: "1:312675330360:web:775428330a1386aac179cd"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let currentLetter = '';
let timerInterval;
let timeLeft = 60;
let playerName = '';
let isHost = false;

const loginScreen = document.getElementById('loginScreen');
const waitingScreen = document.getElementById('waitingScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');
const currentLetterSpan = document.getElementById('currentLetter');
const timeLeftSpan = document.getElementById('timeLeft');
const rankingTableBody = document.querySelector('#rankingTable tbody');
const playersList = document.getElementById('playersList');
const startGameBtn = document.getElementById('startGameBtn');
const notification = document.getElementById('notification');
const timerFill = document.getElementById('timerFill');

const categories = ['nome','pais','animal','objeto'];

document.getElementById('joinBtn').onclick = () => {
  const nameInput = document.getElementById('playerName').value.trim();
  if(!nameInput) return alert("Digite seu nome!");
  playerName = nameInput;
  loginScreen.style.display = 'none';
  waitingScreen.style.display = 'block';

  const playerRef = db.ref('players/' + playerName);
  playerRef.set({joined:true});
  playerRef.onDisconnect().remove();

  db.ref('players').once('value').then(snap=>{
    if(Object.keys(snap.val()||{}).length === 1){
      isHost = true;
      startGameBtn.style.display = 'inline-block';
    }
  });
  listenPlayers();
};

function listenPlayers(){
  db.ref('players').on('value', snap=>{
    const data = snap.val()||{};
    playersList.innerHTML = '';
    Object.keys(data).forEach(p=>{
      const li = document.createElement('li'); li.innerText = p;
      playersList.appendChild(li);
    });
  });
}

startGameBtn.onclick = ()=>{
  startGameBtn.style.display = 'none';
  db.ref('currentRound').set({letter: letters[Math.floor(Math.random()*letters.length)], started:true});
}

db.ref('currentRound').on('value', snap=>{
  const data = snap.val();
  if(!data||!data.started) return;
  currentLetter = data.letter;
  currentLetterSpan.innerText = currentLetter;
  waitingScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  startTimer();
});

function startTimer(){
  timeLeft = 60;
  timeLeftSpan.innerText = timeLeft;
  timerFill.style.width = '100%';
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    timeLeft--;
    timeLeftSpan.innerText = timeLeft;
    timerFill.style.width = (timeLeft/60*100)+'%';
    if(timeLeft<=0) endRound();
  },1000);
}

document.getElementById('submitBtn').onclick = endRound;

function endRound(){
  clearInterval(timerInterval);
  const respostas = {};
  categories.forEach(cat=>respostas[cat] = document.getElementById(cat).value.trim());
  db.ref('rounds/' + currentLetter + '/' + playerName).set(respostas);
  notification.innerText = "Respostas enviadas!";
  gameScreen.style.display = 'none';
  showResults();
}

function showResults(){
  resultsScreen.style.display = 'block';
  rankingTableBody.innerHTML = '';

  db.ref('rounds/' + currentLetter).once('value').then(snapshot=>{
    const data = snapshot.val()||{};
    const points = {};

    categories.forEach(cat=>{
      const values = {};
      for(const player in data){
        const val = (data[player][cat]||'').toLowerCase();
        if(!val) continue;
        values[val] = (values[val]||[]).concat(player);
      }
      for(const val in values){
        values[val].forEach(p=>{
          points[p] = points[p]||0;
          points[p] += values[val].length===1?10:5;
        });
      }
    });

    const ranking = Object.entries(points).sort((a,b)=>b[1]-a[1]);
    ranking.forEach(([p,pts])=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p}</td><td>${pts}</td>`;
      rankingTableBody.appendChild(tr);
    });
  });
}

document.getElementById('nextRoundBtn').onclick = ()=>{
  if(isHost){
    db.ref('currentRound').set({letter: letters[Math.floor(Math.random()*letters.length)], started:true});
  }
  resultsScreen.style.display = 'none';
  notification.innerText = '';
};