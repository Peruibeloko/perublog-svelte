<script>
  import { onMount } from 'svelte';
  import { getLatestPost, getTimeStrings, Post } from '../classes/Post';

  let { title, author, datetime, post } = new Post({});
  let dateStrings = getTimeStrings(datetime);

  async function hashChangeHandler() {
    const postOffset = +location.hash.slice(1);
    const fetchData = await fetch(`${'https://perublog.herokuapp.com'}/post/offset/${postOffset}`);
    const postData = await fetchData.json();
    const postObject = new Post(postData);
    ({ title, author, datetime, post } = postObject);
  }

  onMount(async () => {
    ({ title, author, datetime, post } = await getLatestPost());
    dateStrings = getTimeStrings(datetime);
    addEventListener('hashchange', hashChangeHandler, false);
  });
</script>

<article id="post">
  <h1>{title}</h1>
  <div class="info">
    <small id="author">Post feito por {author} {dateStrings[0]}</small>
    <small id="date">{dateStrings[1]}</small>
  </div>
  <p>{@html post}</p>
</article>

<style>
  #post {
    justify-self: center;
    grid-area: post;
    width: 60%;
  }

  #post h1 {
    font-size: 3rem;
    font-family: var(--sans-serif-title);
    border-left: 7px var(--main-color) solid;
    padding: 0.5rem;
  }

  #post .info {
    margin: 1rem 0;
  }

  #post small {
    font-family: var(--sans-serif-regular);
    font-size: 1rem;
    color: rgb(93, 93, 93);
    font-style: italic;
    display: block;
  }

  #post p {
    font-size: 1rem;
    font-family: var(--serif-regular);
    margin: 1rem;
    padding: 1rem;
    background-color: var(--dark-gray);
    border: 3px rgba(255, 255, 255, 0.4) solid;
    border-radius: 1rem;
    white-space: pre-wrap;
  }

  @media (max-width: 768px) {
    #post {
      width: 100%;
    }

    #post h1 {
      text-align: center;
      margin-top: 1rem;
      border-left: none;
    }

    #post .info {
      margin-top: 0;
      margin-bottom: 3rem;
    }

    #post p {
      margin: 0;
      border-radius: 0;
      border-left: none;
      border-right: none;
    }

    #author {
      text-align: center;
      margin-top: 0;
      font-size: 0.5rem;
    }

    #date {
      text-align: center;
      margin-top: 0;
      font-size: 0.5rem;
    }
  }
</style>
