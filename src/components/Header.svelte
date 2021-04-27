<script>
  function openMobileSocials() {
    document.querySelector('#socials').classList.add('active');
    document.querySelector('#backdrop').classList.add('active');
  }
</script>

<header>
  <h1>
    <a href="/" title="ibe">Peru</a>
  </h1>
  <h2>
    Não tenho muita certeza <br />
    sobre o que é tudo isso aqui
  </h2>
  <div id="hamb" on:click={openMobileSocials}>≡</div>
</header>

<style>
  header {
    grid-area: header;
  }

  header h1 {
    font-size: 4rem;
    font-family: var(--sans-serif-title);
    border-left: 10px var(--main-color) solid;
    padding: 0.5rem;
  }

  header h2 {
    color: var(--gray);
    font-size: 1rem;
    font-family: var(--sans-serif-regular);
    margin: 1rem 0;
  }

  header #hamb {
    display: none;
  }

  @media (max-width: 768px) {
    header {
      margin: 0 1.5rem;
      border-bottom: 3px var(--main-color) solid;
    }

    header h1 {
      border-left: none;
    }

    header h2 {
      display: none;
    }

    header #hamb {
      cursor: pointer;
      display: block;
      font-size: 3rem;
      position: absolute;
      top: 3rem;
      right: 2.5rem;
    }
  }
</style>
