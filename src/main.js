"use strict";
class App {
    constructor(users) {
        this.comments = {};
        this.commentID = 0;
        this.usedElements = {
            input: document.getElementById('input'),
            counter: document.querySelector('.counter'),
            button: document.querySelector('.button'),
            userName: document.querySelector('.user-name'),
            avatar: document.querySelector('.avatar'),
            form: document.querySelector('.input-container'),
        };
        this.users = users;
        this.currentUser = users[0];
        this.createUsersList();
        this.setInputChangeHandler();
        this.usedElements.form.onsubmit = this.handleSubmit.bind(this);
    }
    createUsersList() {
        const usersList = document.querySelector('.chooseUsers');
        for (let [key, user] of Object.entries(this.users)) {
            const newUser = parseFromString(`
                <div class="user ${key}" data-id="${key}">
                  <img src=${user.avatar} alt="">
                  <span>${user.name}</span>
                </div>
            `);
            usersList.append(newUser);
            newUser.onclick = () => {
                this.setCurrentUser(user);
            };
        }
    }
    setCurrentUser(user) {
        this.currentUser = user;
        this.usedElements.userName.innerHTML = `${this.currentUser.name}`;
        this.usedElements.avatar.setAttribute('src', `${this.currentUser.avatar}`);
    }
    setInputChangeHandler() {
        this.usedElements.input.addEventListener('input', (e) => {
            const target = e.currentTarget;
            this.usedElements.counter.innerHTML = `${target.value.length}/1000`;
            target.value.length > 0 ?
                this.usedElements.button.classList.add('buttonActive') :
                this.usedElements.button.classList.remove('buttonActive');
        });
    }
    handleSubmit(e) {
        e.preventDefault();
        const newComment = new Commentary(this.currentUser, this.usedElements.input.value, this);
        newComment.setNewTemplate();
        this.usedElements.input.value = '';
    }
}
class User {
    constructor(id, name, avatar) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.getUserData();
    }
    getUserData() {
        return {
            id: this.id,
            name: this.name,
            avatar: this.avatar
        };
    }
}
class Commentary {
    constructor(author, text, app, parent) {
        this.addToFav = false;
        this.likes = 0;
        this.author = author;
        this.text = text;
        this.timestamp = new Date();
        this.app = app;
        this.id = app.commentID;
        this.parent = parent;
    }
    setNewTemplate() {
        const commentContainer = document.querySelector('.comments-container');
        const date = this.timestamp.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit' });
        const time = this.timestamp.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const parsedNewComment = parseFromString(`
              <div class="comment">
                  <img src="${this.author.avatar}" alt="" width="61" height="61">
                  <div class="userComment">
                    <div>
                      <span class="user-name">${this.author.name}</span>
                      <span class="date">${date} ${time}</span>
                    </div>
                    <p>${this.text}</p>
                    <div class="reaction-container">
                      <span class="respond">
                        <img src="./images/respond-icon.svg" alt="respond" width="26" height="25">
                        <span>Ответить</span>
                      </span>
                      <span class="addToFav">
                        <img src="./images/likeHeart-not-filled.svg" alt="" width="30" height="28">
                        <span>В избранном</span>
                      </span>
                      <div class="likes-counter">
                        <div class="minus">-</div>
                        <span class="initial">0</span>
                        <div class="plus">+</div>
                      </div>
                    </div>
                  </div>
              </div>
        `);
        commentContainer.append(parsedNewComment);
    }
    handleCommentReply() {
        const replyButton = document.querySelector('.respond');
        replyButton.onclick = (e) => {
            const target = e.target;
            // this.parent = target.closest()
        };
    }
}
function parseFromString(template) {
    const parser = new DOMParser();
    return parser.parseFromString(template, 'text/html').body.firstChild;
}
