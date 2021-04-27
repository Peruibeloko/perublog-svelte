<script>
  // TODO Usar Transiçoes do Svelte!
  function closeMobileSocials() {
    document.querySelector('#socials').classList.remove('active');
    document.querySelector('#backdrop').classList.remove('active');
  }
</script>

<aside id="socials">
  <h1>Redes</h1>
  <span id="close" on:click={closeMobileSocials}>→</span>
  <ul>
    <a href="https://soundcloud.com/dynmic" target="_blank">
      <li id="soundcloud">SoundCloud</li>
    </a>
    <a href="https://www.instagram.com/dyn.mic/" target="_blank">
      <li id="instagram">Instagram</li>
    </a>
    <a href="https://www.fb.com/dyn.mic.dnb/" target="_blank">
      <li id="facebook">Facebook</li>
    </a>
    <a href="https://www.twitch.tv/dynmic_brazil" target="_blank">
      <li id="twitch">Twitch</li>
    </a>
    <a href="https://twitter.com/dynmic_brazil" target="_blank">
      <li id="twitter">Twitter</li>
    </a>
  </ul>
</aside>

<style>
  #close {
    display: none;
  }

  #socials {
    grid-area: socials;
    margin: 2rem 0;
  }

  #socials h1 {
    font-size: 2.5rem;
    font-family: var(--sans-serif-title);
  }

  #socials ul {
    display: flex;
    flex-direction: column;
  }

  #socials ul a {
    width: min-content;
  }

  #socials ul li {
    cursor: pointer;
    font-family: var(--sans-serif-regular);
    font-size: 1rem;
    color: white;
    border-left: 5px var(--light-gray) solid;
    padding: 0.5rem;
    margin: 0.5rem 0;
  }

  #socials ul a :hover {
    border-width: 1rem;
    transition: border-width 0.2s ease-in-out;
  }

  #soundcloud {
    border-color: #ff5500 !important;
  }

  #instagram {
    border-color: #dd2a7b !important;
  }

  #facebook {
    border-color: #2d88ff !important;
  }

  #twitch {
    border-color: #9147ff !important;
  }

  #twitter {
    border-color: #1da1f2 !important;
  }

  @media (max-width: 768px) {
    #socials {
      margin: 0;
      padding: 2rem;
      width: 80vw;
      height: 100vh;
      display: block;
      position: fixed;
      top: 0;
      right: 0;
      z-index: 20;
      transform: translateX(100%);
      transition: transform 0.2s ease-in-out;
    }

    #socials.active {
      transform: translateX(0);
    }

    #close {
      cursor: pointer;
      font-size: 2rem;
      position: fixed;
      display: block;
      top: 2.3rem;
      right: 2rem;
    }
  }
</style>
