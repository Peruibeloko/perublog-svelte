<script>
  import { onMount } from 'svelte';
  import { getPostCount } from '../classes/Post';

  let postCount;
  let disabledButtons = {
    firstPost: false,
    previousPost: false,
    nextPost: false,
    lastPost: false
  };

  function firstPost() {
    location = '#1';
  }

  function lastPost() {
    location = '';
  }

  function relativePost(offset) {
    const postNum = +location.hash.slice(1);
    if (!postNum) {
      location = `#${postCount - 1}`;
    } else {
      location = `#${postNum + offset}`;
    }
  }

  function randomPost() {
    const postNum = Math.round(1 + Math.random() * (postCount - 1));
    location = `#${postNum}`;
  }

  function hashChangeHandler() {
    const postNum = +location.hash.substring(1);

    disabledButtons = {
      firstPost: false,
      previousPost: false,
      nextPost: false,
      lastPost: false
    };

    if (postNum === 0 || postNum === postCount) {
      disabledButtons.lastPost = true;
      disabledButtons.nextPost = true;
    } else if (postNum === 1) {
      disabledButtons.previousPost = true;
      disabledButtons.firstPost = true;
    }
  }

  onMount(async () => {
    postCount = await getPostCount();
    addEventListener('hashchange', hashChangeHandler, false);
    hashChangeHandler();
  });
</script>

<nav id="navlist">
  <ul>
    <li>
      <button
        type="button"
        id="firstPost"
        title="Primeiro post"
        on:click={firstPost}
        disabled={disabledButtons.firstPost}>⇇</button
      >
    </li>
    <li>
      <button
        type="button"
        id="previousPost"
        title="Post anterior"
        on:click={relativePost.bind(null, -1)}
        disabled={disabledButtons.previousPost}>←</button
      >
    </li>
    <li>
      <button type="button" id="randomPost" title="Post aleatório" on:click={randomPost}>⤨</button>
    </li>
    <li>
      <button
        type="button"
        id="nextPost"
        title="Próximo post"
        on:click={relativePost.bind(null, 1)}
        disabled={disabledButtons.nextPost}>→</button
      >
    </li>
    <li>
      <button
        type="button"
        id="lastPost"
        title="Último post"
        on:click={lastPost}
        disabled={disabledButtons.lastPost}>⇉</button
      >
    </li>
  </ul>
</nav>

<style>
  #navlist {
    justify-self: end;
    grid-area: navlist;
    position: fixed;
    margin: 2rem 0;
  }

  #navlist ul {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  #navlist ul li button {
    cursor: pointer;
    font-family: var(--sans-serif-regular);
    font-size: 1.5rem;
    text-align: right;
    color: white;
    border: none;
    border-right: 5px var(--main-color) solid;
    padding: 0.5rem;
    margin: 0.5rem 0;
  }

  #navlist ul li button:disabled {
    border-color: var(--light-gray);
  }

  #navlist ul li button:enabled:hover {
    border-width: 1rem;
    transition: border-width 0.2s ease-in-out;
  }

  @media (max-width: 768px) {
    #navlist {
      padding: 0 1.5rem;
      display: block;
      position: relative;
      width: 100%;
    }

    #navlist ul {
      flex-direction: row;
      justify-content: center;
    }

    #navlist ul li {
      width: 20%;
      padding: 0.3rem;
    }

    #navlist ul li button {
      width: 100%;
      text-align: center;
      border-right: none;
      border-bottom: 5px var(--main-color) solid;
    }
  }
</style>
