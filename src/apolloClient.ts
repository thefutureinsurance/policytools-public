import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.REACT_APP_GRAPHQL_URL ?? "http://localhost:8000/api",
  }),
  cache: new InMemoryCache(),
});

export default client;
