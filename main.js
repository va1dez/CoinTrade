//API Keys
// import fetch from 'node-fetch';
const endpointURL = 'https://paper-api.alpaca.markets'
const publicKey = 'PKQL5PRS3SL6MSUK8JZ5'
const privateKey = '8pxL0CHTCu5lB7DdDLQdiPeCI8PlnQxNFot2PBLk'
const headers = {'APCA-API-KEY-ID': publicKey, 'APCA-API-SECRET-KEY' : privateKey}
const postHeaders = {'APCA-API-KEY-ID': publicKey, 'APCA-API-SECRET-KEY' : privateKey, 'Accept' : 'application/json', 'Content-Type' : 'application/json'}


//API endpoints
const returnAccount = '/v2/account';
const ordersInAccount = '/v2/orders';
const positionsInAccount = '/v2/positions';
const accountURL = endpointURL + returnAccount;
const positionURL = endpointURL + positionsInAccount;
const ordersURL = endpointURL + ordersInAccount;
const streamURL = 'wss://stream.data.alpaca.markets/v1beta1/crypto';

//Driver Methods
document.addEventListener('DOMContentLoaded', () => {
  const buyButton = document.querySelector('.buy');
  const crypto = document.querySelector('#asset');
  const amount = document.querySelector('.input');

  

  buyButton.addEventListener('click', () => {
    const notional = amount.value;
    const symbol = crypto.value;
    buy(notional, symbol);
  });
  
  liveBitcoinPull();
  updateData();
  setInterval(updateData, 3000);
});

// Popup indicating purchase successful
function purchaseComplete(data) {
  const coinPurchased = (data.symbol === 'BTCUSD') ? 'Bitcoin' : 'Etherium';
  const qty = data.qty;
  const pricing = data.notional;

  const purchaseConfirmation = document.createElement('div');
  purchaseConfirmation.setAttribute('class', 'purchase-confirmation fade animate');
  purchaseConfirmation.innerHTML = `<span id="PC">Purchase Complete!</span><br><span id="purch">You purchased ${qty} ${coinPurchased} </span><br><span id="total">Total Cost: $${pricing}</span>`;

  const main = document.querySelector('.main');
  const title = document.querySelector('.title');

  main.appendChild(purchaseConfirmation, title);

  setTimeout((node) => {
    node.remove();
  }, 4500, purchaseConfirmation);
}


/**
 * Order ID - client_order_id
 * Quantity - qty
 * Type - symbol
 */

//Sets up stream and 
function updateData() {
  InfoPull(accountURL);
  InfoPull(positionURL);
  //asyncInfoPull(accountURL);
}

function buy(notional, symbol) {
  // let qty = '1';
  // let symbol = 'ETHUSD';
  let type = 'market';
  let side = 'buy';
  let time_in_force = 'day';

  const bodyObject = {
    notional : notional,
    symbol : symbol,
    type : type,
    side : side,
    time_in_force : time_in_force
  }
  buyCoins(ordersURL, bodyObject);
}

async function buyCoins(url, data) {
  await fetch(url,{
    method: 'POST',
    headers : headers,
    body : JSON.stringify(data)
  }).then((response) => {
    return response.json();
  }).then((response) => {
    if (response.status === 'accepted' || response.status === 'filled') {
      console.log("Order accepted");
      purchaseComplete(response);
    };
  })
}

function InfoPull(url) {
  fetch(url, {
    method : 'GET',
    headers : headers,
    cache : 'no-cache'
  }).then((response) => {
    return response.json();
  }).then((response) => {
    if (Array.isArray(response)) positionInfoPopulate(response); 
    else accountInfoPopulate(response);
  });
}

async function asyncInfoPull(url) {
  const response = await fetch(url, {
    method : 'GET',
    headers : headers
  });

  const data = response.json();
  }

function positionInfoPopulate(accountInfo) {
  const BTHholdings = document.querySelector('#btcholdings');
  const ETHholdings = document.querySelector('#ethholdings');
  
  let BTHp = 0;
  let ETHp = 0;

  for (let pos of accountInfo) {
    if (pos.symbol === 'BTCUSD') BTHp = pos.qty;
    if (pos.symbol === 'ETHUSD') ETHp = pos.qty;
  }
  

  BTHholdings.innerText = `BTC Balance: ${BTHp}`;
  ETHholdings.innerText = `ETH Balance: ${ETHp}`;
}

function accountInfoPopulate(accountInfo) {
  const buyingPower = document.querySelector('#buyingpower');

  buyingPower.innerText = `Cash Balance: ${accountInfo.buying_power}`;
}


function liveBitcoinPull() {
  const listener = new WebSocket(streamURL);
  
  listener.addEventListener('message', (msg) => {
    if (msg.data === '[{"T":"success","msg":"connected"}]') {
      listener.send(`{"action":"auth","key":"${publicKey}","secret":"${privateKey}"}`)
    }
    if (msg.data === '[{"T":"success","msg":"authenticated"}]') {
      listener.send('{"action":"subscribe","trades":["BTCUSD","ETHUSD"]}');
      listener.addEventListener('message', updatePrice);
    }
  });

  function updatePrice(msg) {
    const BTCPrice = document.querySelector('#BTC');
    const ETHPrice = document.querySelector('#ETH');
    const lastPrice = JSON.parse(msg.data);
    
    const [BTCp, ETHp] = getPrice(lastPrice);
    
    if (BTCp) BTCPrice.innerText = `BTC Price: ${BTCp}`;
    if (ETHp) ETHPrice.innerText = `ETH Price: ${ETHp}`;
  }
  
  function getPrice(arr) {
    let eth = 0;
    let btc = 0;

    for (let msg of arr) {
      if (msg.S === 'ETHUSD') eth = msg.p;
      if (msg.S === 'BTCUSD') btc = msg.p;
    }

    return [btc, eth];
  }
}