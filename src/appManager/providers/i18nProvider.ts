import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";

const english = englishMessages as typeof englishMessages & {
  resources?: Record<string, unknown>
}

const messages = {
  ...english,
  resources: {
    ...(english.resources ?? {}),
    posts: {
      name: "Post |||| Posts",
      fields: {
        userId: "Author",
        title: "Title",
        body: "Body",
      },
    },
    users: {
      name: "User |||| Users",
      fields: {
        name: "Name",
        username: "Username",
        email: "Email",
        phone: "Phone",
        website: "Website",
        "company.name": "Company",
        "address.street": "Street",
        "address.city": "City",
      },
    },
    comments: {
      name: "Comment |||| Comments",
      fields: {
        postId: "Post",
        name: "Name",
        email: "Email",
        body: "Body",
      },
    },
    todos: {
      name: "Todo |||| Todos",
      fields: {
        userId: "User",
        title: "Title",
        completed: "Completed",
      },
    },
    albums: {
      name: "Album |||| Albums",
      fields: {
        userId: "User",
        title: "Title",
      },
    },
    photos: {
      name: "Photo |||| Photos",
      fields: {
        albumId: "Album",
        title: "Title",
        url: "URL",
        thumbnailUrl: "Thumbnail",
      },
    },
  },
};

export const i18nProvider = polyglotI18nProvider(() => messages, "en");
