class HttpClient {
  constructor() {
    this.API_URL = "https://ajax.test-danit.com/api/json/";
  }

  async getUsers() {
    try {
      return await (await fetch(this.API_URL + "users")).json();
    } catch (e) {
      alert(e.message);
    }
  }

  async getPosts() {
    try {
      return await (await fetch(this.API_URL + "posts")).json();
    } catch (e) {
      alert(e.message);
    }
  }

  async deletePost(postId) {
    try {
      return await fetch(this.API_URL + `posts/${postId}`, {
        method: "DELETE",
      });
    } catch (e) {
      alert(e.message);
    }
  }
}
class TwiApp {
  constructor() {}
  async generateCards(users, posts) {
    const usersData = await users;
    const postsData = await posts;
    const userMap = new Map(usersData.map((user) => [user.id, user]));

    return postsData.reduce((acc, { id: postId, userId, title, body }) => {
      const { name, email } = userMap.get(userId);
      acc.push(new Card(userId, name, email, postId, title, body));

      return acc;
    }, []);
  }

  async renderCards(cardsData) {
    const cards = await cardsData;
    const cardsContainer = document.querySelector(".cards");
    console.log(cards);
    cards.sort((a, b) => 0.5 - Math.random()); // Using to shuffle cards

    cards.forEach((card) => cardsContainer.append(card.createCardElement()));
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
      <button id="delete">Delete post</button>
    `;

    const deleteBtn = cardContainer.querySelector("#delete");
    deleteBtn.addEventListener("click", (e) => {
      this.handleDelete(e.target);
      e.preventDefault();
    });

    return cardContainer;
  }

  async handleDelete(deleteBtn) {
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
const twiApp = new TwiApp();

twiApp.renderCards(
  twiApp.generateCards(httpClient.getUsers(), httpClient.getPosts())
);
