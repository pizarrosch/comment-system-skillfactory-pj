type HTMLElements = {
    input: HTMLInputElement,
    counter: HTMLSpanElement,
    button: HTMLButtonElement,
    userName: HTMLSpanElement,
    avatar: HTMLImageElement,
    form: HTMLFormElement,
    commentContainer: HTMLDivElement,
    favoritesNav: HTMLSpanElement,
    commentsCounter: HTMLSpanElement,
    dropdown: HTMLSelectElement
}

type commentDataTypes = {
    id: number,
    author: number,
    timestamp: string,
    text: string,
    parent?: number | null,
    favorite: boolean,
    likes: number
}

type appDataTypes = {
    comments: Array<commentDataTypes>;
    currentUser: number;
}

type commentaryTypes = {
    author: User,
    text: string,
    app: App,
    parent?: Commentary | null,
}

type Filter = 'all' | 'favorites';
type Order = 'none' | 'likes' | 'date' | 'responses';

function parseFromString(template: string) {
    const parser = new DOMParser();

    return parser.parseFromString(template, 'text/html').body.firstChild;
}

class App {
    currentUser: User;
    users: { [key: number]: User };
    comments: { [key: number]: Commentary } = {};
    commentID: number = 0;
    filter: Filter = 'all';
    order: Order = 'none';

    usedElements: HTMLElements = {
        input: document.getElementById('input') as HTMLInputElement,
        counter: document.querySelector('.counter') as HTMLSpanElement,
        button: document.querySelector('.button') as HTMLButtonElement,
        userName: document.querySelector('.user-name') as HTMLSpanElement,
        avatar: document.querySelector('.avatar') as HTMLImageElement,
        form: document.querySelector('.input-container') as HTMLFormElement,
        commentContainer: document.querySelector('.comments-container') as HTMLDivElement,
        favoritesNav: document.querySelector('.favorites') as HTMLSpanElement,
        commentsCounter: document.querySelector('.comments-counter') as HTMLSpanElement,
        dropdown: document.querySelector('.dropbox') as HTMLSelectElement
    }

    constructor(users: { [key: number]: User }) {
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
        const usersList = document.querySelector('.chooseUsers') as HTMLDivElement;

        usersList.innerHTML = '';

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

        const subCommentForm = document.querySelector('.subcomment-input');
        if (subCommentForm) {
            subCommentForm.children[0].setAttribute('src', `${user.avatar}`)
        }

        this.createUsersList();
        this.sendToLocalStorage();
    }

    setInputChangeHandler(e: Event) {
        const errorMessage = document.querySelector('.error-message') as HTMLSpanElement;
        const target = e.currentTarget as HTMLTextAreaElement;
        this.usedElements.counter.innerHTML = `${target.value.length}/1000`

        if (target.value.length > 1000) {
            this.usedElements.counter.style.color = 'red';
            errorMessage.style.display = 'block';
            this.usedElements.button.setAttribute('disabled', '');
            this.usedElements.button.classList.remove('buttonActive')
        } else if (target.value.length > 0) {
            this.usedElements.counter.style.color = '#A1A1A1';
            errorMessage.style.display = 'none';
            this.usedElements.button.removeAttribute('disabled');
            this.usedElements.button.classList.add('buttonActive')
        }

        // target.style.height = 'auto';
        // target.style.height = `${target.scrollHeight}px`;

        // target.value.length > 0 && target.value.length < 11?
        //     this.usedElements.button.classList.add('buttonActive') :
        //     this.usedElements.button.classList.remove('buttonActive');
    }

    handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        const newComment = new Commentary(
            {
                author: this.currentUser,
                text: this.usedElements.input.value,
                app: this
            }
        )

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

    setOrder(e: Event) {
        const target = e.currentTarget as HTMLOptionElement;
        this.order = target.value as Order;
        console.log(this.order)
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
        const stringData = localStorage.getItem('comment_app') as string;
        if (!stringData) return;

        const rawData: appDataTypes = JSON.parse(stringData);

        for (const commentData of Object.values(rawData.comments)) {
            const commentary = new Commentary(
                {
                    author: this.users[commentData.author],
                    text: commentData.text,
                    app: this
                }
            );

            this.comments[commentary.id] = commentary;
            this.comments[commentData.id].isFavorite = commentData.favorite
            this.comments[commentData.id].likes = commentData.likes
            this.comments[commentData.id].timestamp = new Date(commentData.timestamp)
        }

        for (const commentData of Object.values(rawData.comments)) {
            if (typeof commentData.parent === 'number') {
                this.comments[commentData.id].setParent(this.comments[commentData.parent]);
            }
        }

         this.usedElements.favoritesNav.onclick = () => {
             rawData.comments.filter((favComment, id) => {
                     this.commentID = id;
                     rawData.comments[id].favorite ? console.log('I am fav!'): ''
                 }
             )
         }
         this.currentUser = this.users[rawData.currentUser];
         this.usedElements.commentsCounter.innerHTML = `
              <span class="comments-superscript">Комментарии</span> (${rawData.comments.length})
            `;

    }

    sortByDate(a: Commentary, b: Commentary) {
        return 0;
    }
    sortByLikes(a: Commentary, b: Commentary) {
        return b.likes - a.likes;
    }
    sortByResponses(a: Commentary, b: Commentary) {
        return b.children.length - a.children.length;
    }

    renderAllComments() {
        this.usedElements.commentContainer.innerHTML = '';

        let sorter;

        switch (this.order) {
            case "date": sorter = this.sortByDate;
                break;
            case "likes": sorter = this.sortByLikes;
                break;
            case "responses": sorter = this.sortByResponses;
                break;
            case "none": sorter = () => 0;
        }

        let sorted;

        if (this.order === 'none') {
            sorted = Object.values(this.comments);
        } else {
            sorted = Object.values(this.comments).sort(sorter);
        }

        for (const comment of sorted) {
            if (this.filter === 'favorites' && !comment.isFavorite) {
                continue;
            }

            if (comment.parent) {
                const el = comment.getNewHTML(true) as HTMLDivElement;
                const newCommentDiv = document.querySelector(`.comment[data-id="${comment.parent.id}"]`) as HTMLDivElement;
                const parent = newCommentDiv.closest('.newCommentDiv') as HTMLDivElement;
                parent.appendChild(el);
            } else {
                const el = comment.getNewHTML(false);
                this.usedElements.commentContainer.append(el);
            }
        }
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
    }

    public getData() {
        return {
            id: this.id,
            name: this.name,
            avatar: this.avatar
        };
    }
}

class Commentary {
    id: number;
    author: User;
    timestamp: Date;
    text: string;
    isFavorite: boolean = false;
    likes: number = 0;
    app: App;
    parent?: Commentary | null;
    children: Array<Commentary> = [];
    newComment?: HTMLDivElement;

    constructor({author, text, app, parent} : commentaryTypes) {
        this.author = author;
        this.text = text;
        this.app = app;
        this.parent = parent;
        this.id = app.commentID++;
        this.timestamp = new Date();
    }

    setParent(parent: Commentary) {
        this.parent = parent;
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
                                `<img src='./images/likeHeart-not-filled.svg' alt="" width="30" height="28">`
                            }
                            ${this.isFavorite ?
                                `<span>В избранном</span>` :
                                `<span>В избранное</span>`
                            }
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

        const minus = this.newComment!.querySelector('.minus') as HTMLDivElement;
        const plus = this.newComment!.querySelector('.plus') as HTMLDivElement;

        minus.onclick = this.handleLikeClicks.bind(this);
        plus.onclick = this.handleLikeClicks.bind(this);

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
                {
                    author: this.app.currentUser,
                    text: input.value,
                    app: this.app,
                    parent: this
                }
            )
            this.children.push(newReplyComment);
            this.app.comments[newReplyComment.id] = newReplyComment;

            replyInput.replaceWith(newReplyComment.getNewHTML(true));
            this.app.sendToLocalStorage();
        }

        this.newComment?.scrollIntoView(false);
        return replyInput;
    }

    handleAddToFavorite() {
        const favText = this.newComment!.querySelector('.addToFav span') as HTMLSpanElement;
        const heartImg = this.newComment!.querySelector('.addToFav img') as HTMLImageElement;

        this.isFavorite = !this.isFavorite;
        this.isFavorite ? favText.innerHTML =  'В избранном' : favText.innerHTML = 'В избранное';
        this.isFavorite ? heartImg.src =  './images/heart.svg' : heartImg.src = './images/likeHeart-not-filled.svg';

        this.app.sendToLocalStorage();
    }

    handleLikeClicks(e: MouseEvent) {
        const target = e.currentTarget as HTMLDivElement;
        const likesCounter = this.newComment!.querySelector('.initial') as HTMLDivElement;

        if (target.classList.contains('minus')) {
            likesCounter.innerHTML = String(Number(likesCounter.innerHTML) - 1);
        } else {
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


