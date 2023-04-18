class HttpClient {
  constructor(url) {
    this.API_URL = url;
    this.usersURL = this.API_URL + "users/";
    this.postsURL = this.API_URL + "posts/";
  }

  async getUsers() {
    try {
      return await (await fetch(this.usersURL)).json();
    } catch (e) {
      console.log(e.message);
    }
  }

  async getPosts() {
    try {
      return await (await fetch(this.postsURL)).json();
    } catch (e) {
      console.log(e.message);
    }
  }

  async postPost(userId, title, body) {
    try {
      return await fetch(this.postsURL, {
        method: "POST",
        body: JSON.stringify({
          userId: userId,
          title: title,
          body: body,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  async updatePost(postId, userId, title, body) {
    try {
      return await fetch(this.postsURL + postId, {
        method: "PUT",
        body: JSON.stringify({
          userId: userId,
          id: postId,
          title: title,
          body: body,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  async deletePost(postId) {
    try {
      return await fetch(this.postsURL + postId, {
        method: "DELETE",
      });
    } catch (e) {
      console.log(e.message);
    }
  }
}
class TwiApp {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.addBtn = document.querySelector("#add");
    this.cardsContainer = document.querySelector(".cards");
    this.loadModal = document.querySelector(".load-modal");
    this.addListeners();
    this.renderCards(this.generateCards());
  }

  async addListeners() {
    this.addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleAdd();
    });

    this.cardsContainer.addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.target;
      if (target.tagName === "BUTTON") {
        this.handleCardActions(target);
      }
    });
  }

  handleCardActions(button) {
    const card = button.closest.call(button, ".card");

    if (button.classList.contains("edit-btn")) {
      card.dataset.editing === "true"
        ? this.handleUpdate(card)
        : this.handleEdit(card);
    }

    if (button.classList.contains("delete-btn")) {
      this.handleDelete(card);
    }
  }

  async handleAdd() {
    const formModal = this.createFormModal();
    document.body.prepend(formModal);
    const form = document.querySelector("#add-form");
    form.addEventListener("submit", (e) => this.sendForm(e, formModal, form));
  }

  createFormModal() {
    const formModal = document.createElement("div");
    formModal.classList.add("add-modal");
    formModal.innerHTML = `
          <form id="add-form">
            <label>Input title:<input type="text" id="add__title" /></label>
            <label for="add__body">Input message</label>
            <textarea id="add__body"></textarea>
            <button type="submit" form="add-form" value="Submit">Add</button>
          </form>
        `;
    return formModal;
  }

  async sendForm(e, formModal, form) {
    e.preventDefault();
    const {
      id: userId,
      name,
      email,
    } = JSON.parse(sessionStorage.getItem("currentUser"));
    const title = form.querySelector("#add__title").value;
    const body = form.querySelector("#add__body").value;
    try {
      const response = await this.httpClient.postPost(userId, title, body);

      if (response.ok) {
        const { userId, id, title, body } = await response.json();
        formModal.remove();
        await this.renderCards([
          new Card(userId, name, email, id, title, body),
        ]);
      }
    } catch (e) {
      console.log(e.message);
    }
  }

  handleEdit(card) {
    this.switchEditable(card, true);
  }

  switchEditable(card, isEditable) {
    const editBtn = card.querySelector(".edit-btn");
    card.querySelector(".card__title").contentEditable = `${isEditable}`;
    card.querySelector(".card__content").contentEditable = `${isEditable}`;

    if (isEditable) {
      card.dataset.editing = "true";
      card.querySelector(".card__title").classList.add("editable");
      card.querySelector(".card__content").classList.add("editable");
      editBtn.innerText = "Save post";
    } else {
      delete card.dataset.editing;
      card.querySelector(".card__title").classList.remove("editable");
      card.querySelector(".card__content").classList.remove("editable");
      editBtn.innerText = "Edit post";
    }
  }

  async handleUpdate(card) {
    const postId = card.dataset.postid;
    const userId = card.dataset.userid;
    const title = card.querySelector(".card__title").innerText;
    const body = card.querySelector(".card__content").innerText;

    const response = await this.httpClient.updatePost(
      postId,
      userId,
      title,
      body
    );

    if (response.ok) {
      this.switchEditable(card, false);
    } else {
      console.log(response.message);
    }
  }

  async handleDelete(card) {
    const response = await this.httpClient.deletePost(card.dataset.postid);

    if (response.ok) {
      card.remove();
    } else {
      console.log(response.message);
    }
  }

  async generateCards() {
    const [usersData, postsData] = await Promise.all([
      this.httpClient.getUsers(),
      this.httpClient.getPosts(),
    ]);

    const userMap = new Map(usersData.map((user) => [user.id, user]));

    sessionStorage.setItem(
      // Saving random 'current' user data to use it for new posts
      "currentUser",
      JSON.stringify(userMap.get(Math.floor(Math.random() * 10) + 1))
    );

    return postsData.map(({ id: postId, userId, title, body }) => {
      const { name, email } = userMap.get(userId);
      return new Card(userId, name, email, postId, title, body);
    });
  }

  async renderCards(cardsData) {
    const cards = await cardsData;

    cards.sort((a, b) => 0.5 - Math.random()); // Using to shuffle cards

    this.loadModal.style.display = "none";
    cards.forEach((card) =>
      this.cardsContainer.prepend(card.createCardElement())
    );
  }
}

class Card {
  constructor(userId, name, email, postId, title, body) {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.postId = postId;
    this.title = title;
    this.body = body;
  }

  createCardElement() {
    const cardContainer = document.createElement("div");
    cardContainer.className = "card";
    cardContainer.dataset.userid = this.userId;
    cardContainer.dataset.postid = this.postId;

    cardContainer.innerHTML = `
      <p class="card__name">${this.name}</p>
      <p class="card__email">${this.email}</p>
      <h3 class="card__title">${this.title}</h3>
      <p class="card__content">${this.body}</p>
      <button class="edit-btn">Edit post</button>
      <button class="delete-btn">Delete post</button>
    `;

    return cardContainer;
  }
}

const httpClient = new HttpClient("https://ajax.test-danit.com/api/json/");
const twiApp = new TwiApp(httpClient);
