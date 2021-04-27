<script>
  import Header from './components/Header.svelte';
  import Socials from './components/Socials.svelte';
  import Post from './components/Post.svelte';
  import Navbar from './components/Navbar.svelte';
</script>

<main class="grid-container">
  <span id="backdrop" />
  <Header />
  <Socials />
  <Post />
  <Navbar />
</main>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@500&family=Noto+Serif&family=PT+Sans:ital@0;1&display=swap');

  :root {
    --sans-serif-title: 'Fira Sans', sans-serif;
    --sans-serif-regular: 'PT Sans', sans-serif;
    --serif-regular: 'Noto Serif', serif;
    --main-color: rgb(151, 39, 39);
    --black: rgb(24, 26, 27);
    --gray: rgb(93, 93, 93);
    --dark-gray: rgb(20, 20, 20);
    --light-gray: rgb(160, 160, 160);
    --white: rgb(218, 218, 218);
  }

  :global(*) {
    margin: 0;
    padding: 0;
    text-decoration: none;
    box-sizing: border-box;
    list-style: none;
    background-color: var(--black);
    color: rgb(218, 218, 218);
  }

  #backdrop {
    display: none;
  }

  .grid-container {
    margin: 3rem;
    display: grid;
    grid-template-areas:
      'header post navlist'
      'socials post navlist';
  }

  @media (max-width: 768px) {
    .grid-container {
      margin: 1.5rem 0;
      grid-template-areas:
        'header'
        'post'
        'navlist';
    }

    #backdrop {
      background-color: rgba(0, 0, 0, 0.5);
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 10;
      opacity: 0;
    }

    #backdrop.active {
      display: block;
      opacity: 100%;
      transition: opacity 0.2s ease-in-out;
    }
  }
</style>
