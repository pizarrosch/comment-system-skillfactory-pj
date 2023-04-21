type HTMLElements = {
    input: HTMLInputElement,
    counter: HTMLSpanElement,
    button: HTMLButtonElement,
    userName: HTMLSpanElement,
    avatar: HTMLImageElement,
    form: HTMLFormElement,
    commentContainer: HTMLDivElement
}

class App {
    currentUser: User;
    users: { [key: number]: User };
    comments: { [key: number]: Commentary } = {};
    commentID: number = 0;

    usedElements: HTMLElements = {
        input: document.getElementById('input') as HTMLInputElement,
        counter: document.querySelector('.counter') as HTMLSpanElement,
        button: document.querySelector('.button') as HTMLButtonElement,
        userName: document.querySelector('.user-name') as HTMLSpanElement,
        avatar: document.querySelector('.avatar') as HTMLImageElement,
        form: document.querySelector('.input-container') as HTMLFormElement,
        commentContainer: document.querySelector('.comments-container') as HTMLDivElement
    }

    constructor(users: { [key: number]: User }) {
        this.users = users;
        this.currentUser = users[0];
        this.createUsersList();
        this.usedElements.input.oninput = this.setInputChangeHandler.bind(this);
        this.usedElements.form.onsubmit = this.handleSubmit.bind(this);
    }

    createUsersList() {
        const usersList = document.querySelector('.chooseUsers') as HTMLDivElement;

        for (let [key, user] of Object.entries(this.users)) {
            const newUser = parseFromString(`
                <div class="user ${key}" data-id="${key}">
                  <img src=${user.avatar} alt="">
                  <span>${user.name}</span>
                </div>
            `) as HTMLDivElement

            usersList.append(newUser);

            newUser.onclick = () => {
                this.setCurrentUser(user);
            }
        }
    }

    setCurrentUser(user: User) {
        this.currentUser = user;
        this.usedElements.userName.innerHTML = `${this.currentUser.name}`;
        this.usedElements.avatar.setAttribute('src', `${this.currentUser.avatar}`);
    }

    setInputChangeHandler(e: Event) {
            const target = e.currentTarget as HTMLTextAreaElement;
            this.usedElements.counter.innerHTML = `${target.value.length}/1000`

           // target.style.height = 'auto';
           // target.style.height = `${target.scrollHeight}px`;

            target.value.length > 0 ?
                this.usedElements.button.classList.add('buttonActive') :
                this.usedElements.button.classList.remove('buttonActive');
    }

    handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        const newComment = new Commentary(
            this.currentUser,
            this.usedElements.input.value,
            this
        )

        this.comments[newComment.id] = newComment;
        const newParsedComment = newComment.getNewHTML();
        this.usedElements.commentContainer.append(newParsedComment);
        this.usedElements.input.value = '';
        this.usedElements.counter.innerHTML = 'Макс. 1000 символов';
        this.usedElements.button.classList.remove('buttonActive');
        this.usedElements.commentContainer.scrollIntoView(false);
    }
}

class User {
    id: number;
    name: string;
    avatar: string;

    constructor(id: number, name: string, avatar: string) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.getUserData()
    }

    getUserData() {
        return {
            id: this.id,
            name: this.name,
            avatar: this.avatar
        }
    }
}

class Commentary {
    id: number;
    author: User;
    timestamp: Date;
    text: string;
    addToFav: boolean = false;
    favorites: Array<Element> = [];
    likes: number = 0;
    app: App;
    parent?: Commentary | null;
    newComment?: HTMLDivElement

    constructor(author: User, text: string, app: App, parent?: Commentary) {
        this.author = author;
        this.text = text;
        this.timestamp = new Date();
        this.app = app;
        this.id = app.commentID;
        this.parent = parent;
        this.handleCommentReply.bind(this);
    }

    setNewTemplate(isReply: boolean = false) {
        const date = this.timestamp.toLocaleString('ru-RU', {day: '2-digit', month: '2-digit'});
        const time = this.timestamp.toLocaleString('ru-RU', {hour: '2-digit', minute: '2-digit'});

        let respondee: string = '';

        if (isReply) {
            respondee = `
                <img src="./images/respond-icon.svg" alt="respond" width="26" height="25">
                <span class="user-name responded">${this.parent?.author.name}</span>
            `
        }

        return `
              <div class="newCommentDiv">
                 <div class="comment ${isReply ? 'active' : ''} ${this.addToFav ? 'addedToFav' : ''}">
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
                            <img src='./images/likeHeart-not-filled.svg' alt="" width="30" height="28">
                            <span>В избранное</span>
                          </span>
                          <div class="likes-counter">
                            <div class="minus">-</div>
                            <span class="initial">0</span>
                            <div class="plus">+</div>
                          </div>
                        </div>
                      </div>
                  </div>
              </div>
        `
    }

    getNewHTML(isReplyComment = false) {
        const newStringComment = this.setNewTemplate(isReplyComment);
        this.newComment = parseFromString(newStringComment) as HTMLDivElement;

        const replyButton = this.newComment.querySelector('.respond') as HTMLSpanElement;
        const heart = this.newComment.querySelector('.addToFav') as HTMLSpanElement;
        const favorites = document.querySelector('.favorites') as HTMLSpanElement;

        replyButton.onclick = this.handleCommentReply.bind(this);
        heart.onclick = this.handleAddToFavorite.bind(this);
        console.log(this.favorites)
        favorites.onclick = this.showFavorites.bind(this);

        return this.newComment;
    }

    handleCommentReply() {
        document.querySelector('.subcomment-input')?.remove()

        const replyInput = parseFromString(`
            <form class="input-container subcomment-input">
              <img class="avatar" src=${this.app.currentUser.avatar} width="30" height="30" alt=""/>
              <input placeholder="Введите текст сообщения..." id="input" name="replyInput">
            </form>
        `) as HTMLFormElement
        this.newComment?.appendChild(replyInput)
        this.newComment?.scrollIntoView(false);

        const input = replyInput.elements.namedItem('replyInput') as HTMLTextAreaElement;

        replyInput.onsubmit = () => {
            const newReplyComment = new Commentary(
                this.app.currentUser,
                input.value,
                this.app,
                this
            )
            this.app.comments[newReplyComment.id] = newReplyComment;

            replyInput.replaceWith(newReplyComment.getNewHTML(true));

            this.newComment?.scrollIntoView(false);
        }
    }

    handleAddToFavorite() {
        this.addToFav = !this.addToFav;
        const favText = this.newComment!.querySelector('.addToFav span') as HTMLSpanElement;
        const heartImg = this.newComment!.querySelector('.addToFav img') as HTMLImageElement;
        const newCommentDiv = this.newComment!.querySelector('.comment') as HTMLDivElement;

        favText.innerHTML = this.addToFav ? 'В избранном' : 'В избранное';
        heartImg.src = this.addToFav ? './images/heart.svg' : './images/likeHeart-not-filled.svg';

        if (this.addToFav) {
            this.favorites.push(this.newComment!)
        }

    }

    showFavorites() {
        const newCommentDiv = this.newComment!.querySelectorAll('.addedToFav') as NodeListOf<Element>;

        for (let el of newCommentDiv) {
            console.log(el)
        }
    }
}

function parseFromString(template: string) {
    const parser = new DOMParser();

    return parser.parseFromString(template, 'text/html').body.firstChild;
}
