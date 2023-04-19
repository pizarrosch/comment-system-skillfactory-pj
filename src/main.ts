type HTMLElements = {
    input: HTMLInputElement,
    counter: HTMLSpanElement,
    button: HTMLButtonElement,
    userName: HTMLSpanElement,
    avatar: HTMLImageElement,
    form: HTMLFormElement,
}

class App {
    currentUser: User;
    users: {[key: number]: User};
    comments: {[key: number]: Commentary} = {};
    commentID: number = 0;

    usedElements: HTMLElements = {
        input: document.getElementById('input') as HTMLInputElement,
        counter: document.querySelector('.counter') as HTMLSpanElement,
        button: document.querySelector('.button') as HTMLButtonElement,
        userName: document.querySelector('.user-name') as HTMLSpanElement,
        avatar: document.querySelector('.avatar') as HTMLImageElement,
        form: document.querySelector('.input-container') as HTMLFormElement,
    }

    constructor(users: {[key: number]: User}) {
        this.users = users;
        this.currentUser = users[0];
        this.createUsersList();
        this.setInputChangeHandler();
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

    setInputChangeHandler() {
        this.usedElements.input.addEventListener('input', (e) => {
            const target = e.currentTarget as HTMLInputElement;
            this.usedElements.counter.innerHTML = `${target.value.length}/1000`

            target.value.length > 0 ?
                this.usedElements.button.classList.add('buttonActive') :
                this.usedElements.button.classList.remove('buttonActive');
        })
    }

    handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        const newComment = new Commentary(
            this.currentUser,
            this.usedElements.input.value,
            this
        )

        newComment.setNewTemplate();
        this.usedElements.input.value = '';
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
    likes: number = 0;
    app: App;
    parent?: Commentary|null;

    constructor(author: User, text: string, app: App, parent?: Commentary) {
        this.author = author;
        this.text = text;
        this.timestamp = new Date();
        this.app = app;
        this.id = app.commentID;
        this.parent = parent;
    }

    setNewTemplate() {
        const commentContainer = document.querySelector('.comments-container') as HTMLDivElement;
        const date = this.timestamp.toLocaleString('ru-RU', {day: '2-digit', month: '2-digit'});
        const time = this.timestamp.toLocaleString('ru-RU', {hour: '2-digit', minute: '2-digit'});

        const parsedNewComment = parseFromString(
            `
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
        `
        ) as HTMLDivElement

        commentContainer.append(parsedNewComment);
    }

    handleCommentReply() {
        const replyButton = document.querySelector('.respond') as HTMLSpanElement;

        replyButton.onclick = (e) => {
            const target = e.target as HTMLSpanElement;
            // this.parent = target.closest()
        }
    }
}

function parseFromString(template: string) {
    const parser = new DOMParser();

    return parser.parseFromString(template, 'text/html').body.firstChild;
}
