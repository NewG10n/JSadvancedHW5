class HttpClient {
  constructor() {
    this.API_URL = "https://ajax.test-danit.com/api/json/";
    this.usersURL = this.API_URL + "users/";
    this.postsURL = this.API_URL + "posts/";
  }

  async getUsers() {
    try {
      return await (await fetch(this.usersURL)).json();
    } catch (e) {
      alert(e.message);
    }
  }

  async getPosts() {
    try {
      return await (await fetch(this.postsURL)).json();
    } catch (e) {
      alert(e.message);
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
      alert(e.message);
    }
  }

  async deletePost(postId) {
    try {
      return await fetch(this.postsURL + postId, {
        method: "DELETE",
      });
    } catch (e) {
      alert(e.message);
    }
  }
}
class TwiApp {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.addPost();
  }

  async addPost() {
    const addBtn = document.querySelector("#add");
    addBtn.addEventListener("click", (e) => {
      Card.handleAdd();
      e.preventDefault();
    });
  }

  async generateCards() {
    const [usersData, postsData] = await Promise.all([
      this.httpClient.getUsers(),
      this.httpClient.getPosts(),
    ]);

    const userMap = new Map(usersData.map((user) => [user.id, user]));

    return postsData.reduce((acc, { id: postId, userId, title, body }) => {
      const { name, email } = userMap.get(userId);
      acc.push(new Card(userId, name, email, postId, title, body));

      return acc;
    }, []);
  }

  static async renderCards(cardsData) {
    const cards = await cardsData;
    const loadModal = document.querySelector(".load-modal");
    const cardsContainer = document.querySelector(".cards");

    cardsContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("delete-btn")) {
        Card.handleDelete(target);
        e.preventDefault();
      }
    });

    cards.sort((a, b) => 0.5 - Math.random()); // Using to shuffle cards
    loadModal.style.display = "none";
    cards.forEach((card) => cardsContainer.prepend(card.createCard()));
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

  createCard() {
    const cardContainer = document.createElement("div");
    cardContainer.className = "card";
    cardContainer.dataset.postid = this.postId;

    cardContainer.innerHTML = `
      <p class="card__name">${this.name}</p>
      <p class="card__email">${this.email}</p>
      <h3 class="card__title">${this.title}</h3>
      <p class="card__content">${this.body}</p>
      <button class="delete-btn">Delete post</button>
    `;

    return cardContainer;
  }

  static async handleAdd() {
    const addModal = document.querySelector(".add-modal");
    addModal.style.display = "flex";
    const form = document.querySelector("#add-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = "1";
      const title = form.querySelector("#add__title").value || " ";
      const body = form.querySelector("#add__body").value || " ";
      const response = await httpClient.postPost(userId, title, body);

      if (response.ok) {
        const { userId, id, title, body } = await response.json();
        const card = new Card(userId, "RK", "rk@gm.co", id, title, body);

        form.reset();
        addModal.style.display = "none";

        await TwiApp.renderCards([card.createCard()]);
      }
    });
  }

  static async handleDelete(deleteBtn) {
    const card = deleteBtn.closest(".card");
    const postId = card.dataset.postid;
    const response = await httpClient.deletePost(postId);

    if (response.ok) {
      card.remove();
    } else {
      alert(response.message);
    }
  }
}

const httpClient = new HttpClient();
const twiApp = new TwiApp(httpClient);

TwiApp.renderCards(twiApp.generateCards());
