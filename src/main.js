"use strict";
function parseFromString(template) {
    const parser = new DOMParser();
    return parser.parseFromString(template, 'text/html').body.firstChild;
}
class App {
    constructor(users) {
        this.comments = {};
        this.commentID = 0;
        this.filter = 'all';
        this.order = 'none';
        this.usedElements = {
            input: document.getElementById('input'),
            counter: document.querySelector('.counter'),
            button: document.querySelector('.button'),
            userName: document.querySelector('.user-name'),
            avatar: document.querySelector('.avatar'),
            form: document.querySelector('.input-container'),
            commentContainer: document.querySelector('.comments-container'),
            favoritesNav: document.querySelector('.favorites'),
            commentsCounter: document.querySelector('.comments-counter'),
            dropdown: document.querySelector('.dropbox')
        };
        this.users = users;
        this.currentUser = users[0];
        this.load();
        this.renderAllComments();
        this.createUsersList();
        this.usedElements.input.oninput = this.setInputChangeHandler.bind(this);
        this.usedElements.form.onsubmit = this.handleSubmit.bind(this);
        // this.sortComments.bind(this)();
        this.usedElements.favoritesNav.onclick = this.showFavorites.bind(this);
        this.usedElements.commentsCounter.onclick = this.showAll.bind(this);
        this.usedElements.dropdown.onchange = this.setOrder.bind(this);
    }
    createUsersList() {
        const usersList = document.querySelector('.chooseUsers');
        usersList.innerHTML = '';
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
        const subCommentForm = document.querySelector('.subcomment-input');
        if (subCommentForm) {
            subCommentForm.children[0].setAttribute('src', `${user.avatar}`);
        }
        this.createUsersList();
        this.sendToLocalStorage();
    }
    setInputChangeHandler(e) {
        const errorMessage = document.querySelector('.error-message');
        const target = e.currentTarget;
        this.usedElements.counter.innerHTML = `${target.value.length}/1000`;
        if (target.value.length > 1000) {
            this.usedElements.counter.style.color = 'red';
            errorMessage.style.display = 'block';
            this.usedElements.button.setAttribute('disabled', '');
            this.usedElements.button.classList.remove('buttonActive');
        }
        else if (target.value.length > 0) {
            this.usedElements.counter.style.color = '#A1A1A1';
            errorMessage.style.display = 'none';
            this.usedElements.button.removeAttribute('disabled');
            this.usedElements.button.classList.add('buttonActive');
        }
        // target.style.height = 'auto';
        // target.style.height = `${target.scrollHeight}px`;
        // target.value.length > 0 && target.value.length < 11?
        //     this.usedElements.button.classList.add('buttonActive') :
        //     this.usedElements.button.classList.remove('buttonActive');
    }
    handleSubmit(e) {
        e.preventDefault();
        const newComment = new Commentary({
            author: this.currentUser,
            text: this.usedElements.input.value,
            app: this
        });
        this.comments[newComment.id] = newComment;
        const newParsedComment = newComment.getNewHTML();
        this.usedElements.commentContainer.append(newParsedComment);
        this.sendToLocalStorage();
        this.usedElements.input.value = '';
        this.usedElements.commentsCounter.innerHTML = `
          <span class="comments-superscript">Комментарии</span> ${!this.commentID ? '(0)' : `(${this.commentID})`}
        `;
        this.usedElements.counter.innerHTML = 'Макс. 1000 символов';
        this.usedElements.button.classList.remove('buttonActive');
        this.usedElements.commentContainer.scrollIntoView(false);
    }
    //
    // sortComments() {
    //     const dropdownMenu = document.querySelector('.dropbox') as HTMLSelectElement;
    //     dropdownMenu.onchange = (e) => {
    //         const target =  e.target as HTMLOptionElement;
    //         if (target.value === 'likesNumber') {
    //            Object.values(this.comments).sort((a: Commentary, b: Commentary) => {
    //                return b.likes - a.likes
    //            })
    //         }
    //     }
    // }
    showFavorites() {
        this.filter = 'favorites';
        this.renderAllComments();
    }
    showAll() {
        this.filter = 'all';
        this.renderAllComments();
    }
    setOrder(e) {
        const target = e.currentTarget;
        this.order = target.value;
        console.log(this.order);
        this.renderAllComments();
    }
    sendToLocalStorage() {
        let commentsData = [];
        for (const comment of Object.values(this.comments)) {
            commentsData.push(comment.getData());
        }
        localStorage.setItem('comment_app', JSON.stringify({
            comments: commentsData,
            currentUser: this.currentUser.id,
            commentID: this.commentID,
        }));
    }
    load() {
        const stringData = localStorage.getItem('comment_app');
        if (!stringData)
            return;
        const rawData = JSON.parse(stringData);
        for (const commentData of Object.values(rawData.comments)) {
            const commentary = new Commentary({
                author: this.users[commentData.author],
                text: commentData.text,
                app: this
            });
            this.comments[commentary.id] = commentary;
            this.comments[commentData.id].isFavorite = commentData.favorite;
            this.comments[commentData.id].likes = commentData.likes;
            this.comments[commentData.id].timestamp = new Date(commentData.timestamp);
        }
        for (const commentData of Object.values(rawData.comments)) {
            if (typeof commentData.parent === 'number') {
                this.comments[commentData.id].setParent(this.comments[commentData.parent]);
            }
        }
        this.usedElements.favoritesNav.onclick = () => {
            rawData.comments.filter((favComment, id) => {
                this.commentID = id;
                rawData.comments[id].favorite ? console.log('I am fav!') : '';
            });
        };
        this.currentUser = this.users[rawData.currentUser];
        this.usedElements.commentsCounter.innerHTML = `
              <span class="comments-superscript">Комментарии</span> (${rawData.comments.length})
            `;
    }
    sortByDate(a, b) {
        return 0;
    }
    sortByLikes(a, b) {
        return b.likes - a.likes;
    }
    sortByResponses(a, b) {
        return b.children.length - a.children.length;
    }
    renderAllComments() {
        this.usedElements.commentContainer.innerHTML = '';
        let sorter;
        switch (this.order) {
            case "date":
                sorter = this.sortByDate;
                break;
            case "likes":
                sorter = this.sortByLikes;
                break;
            case "responses":
                sorter = this.sortByResponses;
                break;
            case "none": sorter = () => 0;
        }
        let sorted;
        if (this.order === 'none') {
            sorted = Object.values(this.comments);
        }
        else {
            sorted = Object.values(this.comments).sort(sorter);
        }
        for (const comment of sorted) {
            if (this.filter === 'favorites' && !comment.isFavorite) {
                continue;
            }
            if (comment.parent) {
                const el = comment.getNewHTML(true);
                const newCommentDiv = document.querySelector(`.comment[data-id="${comment.parent.id}"]`);
                const parent = newCommentDiv.closest('.newCommentDiv');
                parent.appendChild(el);
            }
            else {
                const el = comment.getNewHTML(false);
                this.usedElements.commentContainer.append(el);
            }
        }
    }
}
class User {
    constructor(id, name, avatar) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
    }
    getData() {
        return {
            id: this.id,
            name: this.name,
            avatar: this.avatar
        };
    }
}
class Commentary {
    constructor({ author, text, app, parent }) {
        this.isFavorite = false;
        this.likes = 0;
        this.children = [];
        this.author = author;
        this.text = text;
        this.app = app;
        this.parent = parent;
        this.id = app.commentID++;
        this.timestamp = new Date();
    }
    setParent(parent) {
        this.parent = parent;
    }
    setNewTemplate(isReply = false) {
        var _a;
        const date = this.timestamp.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit' });
        const time = this.timestamp.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        let respondee = '';
        if (isReply) {
            respondee = `
                <img src="./images/respond-icon.svg" alt="respond" width="26" height="25">
                <span class="user-name responded">${(_a = this.parent) === null || _a === void 0 ? void 0 : _a.author.name}</span>
            `;
        }
        return `
              <div class="newCommentDiv">
                 <div class="comment ${isReply ? 'active' : ''}" data-id="${this.id}">
                      <img src="${this.author.avatar}" alt="" width="61" height="61">
                      <div class="user-comment">
                        <div class=${isReply ? 'respondee-container' : ''}>
                          <span class="user-name">${this.author.name}</span>
                          ${respondee}
                          <span class="date">${date} ${time}</span>
                        </div>
                        <p>${this.text}</p>
                        <div class="reaction-container">
                          <span class="respond">
                            <img src="./images/respond-icon.svg" alt="respond" width="26" height="25">
                            <span>Ответить</span>
                          </span>
                          <span class="addToFav">
                            ${this.isFavorite ?
            `<img src='./images/heart.svg' alt="" width="30" height="28">` :
            `<img src='./images/likeHeart-not-filled.svg' alt="" width="30" height="28">`}
                            ${this.isFavorite ?
            `<span>В избранном</span>` :
            `<span>В избранное</span>`}
                          </span>
                          <div class="likes-counter">
                            <div class="minus" style="cursor: pointer; user-select: none">-</div>
                            <span class="initial">${this.likes}</span>
                            <div class="plus" style="cursor: pointer; user-select: none">+</div>
                          </div>
                        </div>
                      </div>
                  </div>
              </div>
        `;
    }
    getNewHTML(isReplyComment = false) {
        const newStringComment = this.setNewTemplate(isReplyComment);
        this.newComment = parseFromString(newStringComment);
        const replyButton = this.newComment.querySelector('.respond');
        const heart = this.newComment.querySelector('.addToFav');
        const favorites = document.querySelector('.favorites');
        replyButton.onclick = this.handleCommentReply.bind(this);
        heart.onclick = this.handleAddToFavorite.bind(this);
        const minus = this.newComment.querySelector('.minus');
        const plus = this.newComment.querySelector('.plus');
        minus.onclick = this.handleLikeClicks.bind(this);
        plus.onclick = this.handleLikeClicks.bind(this);
        return this.newComment;
    }
    handleCommentReply() {
        var _a, _b, _c, _d;
        (_a = document.querySelector('.subcomment-input')) === null || _a === void 0 ? void 0 : _a.remove();
        const replyInput = parseFromString(`
            <form class="input-container subcomment-input">
              <img class="avatar" src=${this.app.currentUser.avatar} width="30" height="30" alt=""/>
              <input placeholder="Введите текст сообщения..." id="input" name="replyInput">
            </form>
        `);
        (_b = this.newComment) === null || _b === void 0 ? void 0 : _b.appendChild(replyInput);
        (_c = this.newComment) === null || _c === void 0 ? void 0 : _c.scrollIntoView(false);
        const input = replyInput.elements.namedItem('replyInput');
        replyInput.onsubmit = () => {
            const newReplyComment = new Commentary({
                author: this.app.currentUser,
                text: input.value,
                app: this.app,
                parent: this
            });
            this.children.push(newReplyComment);
            this.app.comments[newReplyComment.id] = newReplyComment;
            replyInput.replaceWith(newReplyComment.getNewHTML(true));
            this.app.sendToLocalStorage();
        };
        (_d = this.newComment) === null || _d === void 0 ? void 0 : _d.scrollIntoView(false);
        return replyInput;
    }
    handleAddToFavorite() {
        const favText = this.newComment.querySelector('.addToFav span');
        const heartImg = this.newComment.querySelector('.addToFav img');
        this.isFavorite = !this.isFavorite;
        this.isFavorite ? favText.innerHTML = 'В избранном' : favText.innerHTML = 'В избранное';
        this.isFavorite ? heartImg.src = './images/heart.svg' : heartImg.src = './images/likeHeart-not-filled.svg';
        this.app.sendToLocalStorage();
    }
    handleLikeClicks(e) {
        const target = e.currentTarget;
        const likesCounter = this.newComment.querySelector('.initial');
        if (target.classList.contains('minus')) {
            likesCounter.innerHTML = String(Number(likesCounter.innerHTML) - 1);
        }
        else {
            likesCounter.innerHTML = String(Number(likesCounter.innerHTML) + 1);
        }
        this.likes = Number(likesCounter.innerHTML);
        this.app.sendToLocalStorage();
    }
    getData() {
        return {
            id: this.id,
            author: this.author.id,
            timestamp: this.timestamp.toString(),
            text: this.text,
            parent: this.parent ? this.parent.id : null,
            favorite: this.isFavorite,
            likes: this.likes
        };
    }
}
