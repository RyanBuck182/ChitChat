/**
 * Represents a response object with a list of messages.
 * @typedef {Object} MessageResponse
 * @property {number} count - The total count of messages.
 * @property {string} date - The date of the response in GMT format.
 * @property {Array} messages - An array containing individual message objects.
 */

/**
 * Represents an individual message object.
 * @typedef {Object} Message
 * @property {string} _id - The unique identifier for the message.
 * @property {string} client - The client associated with the message.
 * @property {string} date - The date of the message in GMT format.
 * @property {number} dislikes - The number of dislikes for the message.
 * @property {string} ip - The IP address associated with the message.
 * @property {number} likes - The number of likes for the message.
 * @property {Array<number | null>} loc - The location coordinates associated with the message.
 * @property {string} message - The content of the message.
 */

/**
 * Represents an individual object to create a message.
 * @typedef {Object} CreateMessage
 * @property {string} key - The API key associated with the client
 * @property {string} client - The client associated with the message.
 * @property {number} lat - The latitude coordinate associated with the message.
 * @property {number} lon - The longitude coordinate associated with the message.
 * @property {string} message - The content of the message.
 */

// changed for privacy
const CHIT_CHAT_URL = "https://example.com/chitchat";
const API_KEY = "abcd";
const CLIENT_ID = "test@example.com";

/**
 * Makes a GET request to Chit Chat Server 
 * that responds with a MessageResponse
 * @param {number} [skip=0] skips X number of messages
 * @param {number} [limit=20] determines batch size
 * @returns {MessageResponse}
 */
async function getMessages(skip = 0, limit = 20) {
    const query = new URLSearchParams({
        key: API_KEY,
        client: CLIENT_ID,
        skip: skip,
        limit: limit,
    });
    const response = await fetch(`${CHIT_CHAT_URL}?${query}`);
    const json = await response.json();
    return json;
}

/**
 * Makes a POST Request to Chit Chat Server
 * @param {string} message the message to be sent
 * @returns {{ code: number; message: string }}
 */
async function postMessage(message, latitude, longitude) {
    const query = new URLSearchParams({
        key: API_KEY,
        client: CLIENT_ID,
        lat: latitude,
        lon: longitude,
        message: message
    });
    const response = await fetch(`${CHIT_CHAT_URL}?${query}`, {
       method: "POST" 
    });
    const json = await response.json();
    return json;
}

/**
 * Makes GET Request to Like Endpoint
 * @param {string} messageId 
 * @returns {{ code: number; message: string }}
 */
async function likeMessage(messageId) {
    const query = new URLSearchParams({
        key: API_KEY,
        client: CLIENT_ID
    });
    const response = await fetch(`${CHIT_CHAT_URL}/like/${messageId}?${query}`, {
       method: "GET" 
    });
    const json = await response.json();
    return json;
}

/**
 * Makes GET Request to Dislike Endpoint
 * @param {string} messageId 
 * @returns {{ code: number; message: string }}
 */
async function dislikeMessage(messageId) {
    const query = new URLSearchParams({
        key: API_KEY,
        client: CLIENT_ID
    });
    const response = await fetch(`${CHIT_CHAT_URL}/dislike/${messageId}?${query}`, {
       method: "GET" 
    });
    const json = await response.json();
    return json;
}

let messageComposer = document.getElementById('messageComposer');
let messageContainer = document.getElementById('messageContainer');
let inputBox = document.getElementById('inputBox');
let loadButton = document.getElementById('loadButton');
let refreshButton = document.getElementById('refreshButton');
let postButton = document.getElementById('postButton');

const earthRadiusMiles = 3958.761;
const positionOptions = { enableHighAccuracy: true };
const likePath = 'Images/FullLike.png';
const dislikePath = 'Images/FullDislike.png';

let messagesOnScreen = 0;

/**
 * Displays the messages from a message response.
 * @param {MessageResponse} messageResponse 
 */
function displayMessages(messageResponse) {
    messagesOnScreen += messageResponse.count;

    for (let i = 0; i < messageResponse.count; i++)
        messageContainer.appendChild(createMessageElement(messageResponse.messages[i]));
}

/**
 * Creates and returns an HTML element for a message.
 * @param {Message} message 
 * @returns {Element}
 */
function createMessageElement(message) {
    let messageElement = document.createElement('article');
    messageElement.className = 'message';
    messageElement.id = message._id;
    messageElement.innerHTML = `
    <header>
        <h2 class="author left">${message.client}</h2>
        <h2 class="ratings right">
            <span class="likeCount">${message.likes}</span>
            <button><img src="Images/EmptyLike.png" alt="like"></button>
            |
            <button><img src="Images/EmptyDislike.png" alt="dislike"></button>
            <span class="dislikeCount">${message.dislikes}</span>
        </h2>
    </header>
    <p class="content"></p>
    <footer>
        <h2 class="date left">${message.date}</h2>
        <h2 class="distance right"></h2>
    </footer>`

    //Sets message contents.
    messageElement.getElementsByClassName('content')[0].innerText = message.message;

    setMessageDistance(messageElement, message.loc)

    setMessageRatings(messageElement);

    return messageElement;
}

/**
 * Sets the distance from the client on a message element.
 * @param {Element} messageElement
 * @param {(number | null)[]} messageLocation
 */
function setMessageDistance(messageElement, messageLocation) {
    let distanceElement = messageElement.getElementsByClassName('distance right')[0];
    
    //if there's no location attached to the message, skip it
    if (messageLocation[0] == null || messageLocation[0] == 'null') {
        distanceElement.innerText = '';
        return;
    }
    
    //Code inside runs once the client's position has been obtained.
    navigator.geolocation.getCurrentPosition((clientPosition) => {
        let clientLatitude = clientPosition.coords.latitude * Math.PI / 180;
        let clientLongitude = clientPosition.coords.longitude * Math.PI / 180;
    
        let messageLatitude = messageLocation[1] * Math.PI / 180;
        let messageLongitude = messageLocation[0] * Math.PI / 180;

        let distance = haversineFormula(clientLatitude, clientLongitude, messageLatitude, messageLongitude);

        if (distance < 1) 
            distanceElement.innerText = (Math.floor(distance * 5280 * 100) / 100) + ' feet away';
        else
            distanceElement.innerText = (Math.floor(distance * 100) / 100) + ' miles away';
    }, null, positionOptions);
}

/**
 * Calculates and returns the great circle distance between two coordinates on the Earth. The coordinates should be in radians.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number}
 */
function haversineFormula(lat1, lon1, lat2, lon2) {
    return 2 * earthRadiusMiles * Math.asin(Math.sqrt(hav(lat2 - lat1) + Math.cos(lat1) * Math.cos(lat2) * hav(lon2 - lon1)));
}

/**
 * Calculates and returns the haversine of an angle (in radians).
 * @param {number} num
 * @returns {number}
 */
function hav(num) {
    return Math.pow(Math.sin(num / 2), 2);
}

/**
 * Sets the ratings on a message element.
 * @param {Element} messageElement 
 */
function setMessageRatings(messageElement) {
    let buttons = messageElement.getElementsByClassName('ratings')[0].getElementsByTagName('button');
    let likeButton = buttons[0];
    let dislikeButton = buttons[1];
    let messageId = messageElement.id;
    let ratingStatus = localStorage.getItem(messageId);

    if (ratingStatus == 'like') {
        likeButton.getElementsByTagName('img')[0].src = likePath;
    }
    else if (ratingStatus == 'dislike') {
        dislikeButton.getElementsByTagName('img')[0].src = dislikePath;
    }

    likeButton.onclick = () => {rateMessage(messageId, buttons, 'like')};
    dislikeButton.onclick = () => {rateMessage(messageId, buttons, 'dislike')};
}

/**
 * Makes a post.
 * @param {GeolocationPosition} clientPosition 
 */
function makePost(clientPosition) {
    let latitude = clientPosition.coords.latitude;
    let longitude = clientPosition.coords.longitude;

    postMessage(inputBox.value, latitude, longitude);

    let contents = inputBox.value;
    getMessages(0, 1).then((messageResponse) => createMessageElementAfterPost(messageResponse, contents));

    inputBox.value = '';
}

/**
 * Creates a message element and displays it as the first message.
 * @param {MessageResponse} messageResponse 
 * @param {string} contents 
 */
function createMessageElementAfterPost(messageResponse, contents) {
    let message = messageResponse.messages[0];

    //if getMessages returns before postMessage, it will do getMessages again
    if (contents != message.message)
        getMessages(0, 1).then((messageResponse) => createMessageElementAfterPost(messageResponse, contents));
    else {
        messageContainer.prepend(createMessageElement(message));
        messagesOnScreen++;
    }
}

/**
 * Rates a message.
 * @param {string} messageId
 * @param {Element[]} button 
 * @param {'like' | 'dislike'} action
 */
function rateMessage(messageId, buttons, action) {
    if (localStorage.getItem(messageId) != null)
        return;

    let likeButton = buttons[0];
    let likeImage = likeButton.getElementsByTagName('img')[0];
    let likeCount = likeButton.parentElement.getElementsByClassName('likeCount')[0];
    let dislikeButton = buttons[1];
    let dislikeImage = dislikeButton.getElementsByTagName('img')[0];
    let dislikeCount = dislikeButton.parentElement.getElementsByClassName('dislikeCount')[0];
    
    if (action == 'like') {
        likeCount.innerText = Number(likeCount.innerText) + 1;
        likeImage.src = likePath;
        localStorage.setItem(messageId, 'like');
        likeMessage(messageId);
    }
    else if (action == 'dislike') {
        dislikeCount.innerText = Number(dislikeCount.innerText) + 1;
        dislikeImage.src = dislikePath;
        localStorage.setItem(messageId, 'dislike');
        dislikeMessage(messageId);
    }
    else
        console.log('Invalid rating action. Must be \'like\' or \'dislike\'.');
}

/**
 * Refreshes the messages on screen.
 */
function refreshMessages() {
    messageContainer.innerHTML = '';
    messagesOnScreen = 0;

    getMessages().then((messageResponse) => displayMessages(messageResponse));
}

//Adds the client id to "Posting as "
messageComposer.getElementsByTagName('h3')[0].innerText += ' ' + CLIENT_ID;

//Displays initial messages
refreshMessages();

//Connects the load more button to displayMessages 
loadButton.onclick = () => {getMessages(messagesOnScreen).then((messageResponse) => displayMessages(messageResponse))};

//Connects the refresh button to refreshMessages
refreshButton.onclick = refreshMessages;

//Connects the post button to makePost
postButton.onclick = () => {navigator.geolocation.getCurrentPosition((clientPosition) => makePost(clientPosition), null, positionOptions)};