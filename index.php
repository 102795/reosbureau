<?php
// Horizon Reizen — hoofdpagina. Alle content wordt client-side gerenderd
// (js/app.js) op basis van data die via api.php uit data/trips.json komt.
?>
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Horizon Reizen — Studentiereizen</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<nav class="navbar" id="navbar">
  <div class="navbar-inner">
    <button class="brand" data-nav="home" aria-label="Home">
      <span class="brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 17l4-8 4 3 3-6 4 11" />
          <path d="M3 21h18" />
        </svg>
      </span>
      <span class="brand-name">Horizon Reizen</span>
    </button>
    <div class="nav-links">
      <button class="nav-link" data-nav="home">Home</button>
      <button class="nav-link" data-nav="student">Studentenportaal</button>
      <button class="nav-link nav-link-accent" data-nav="admin">Admin</button>
    </div>
  </div>
</nav>

<main id="app">
  <div class="page-loading">Bezig met laden…</div>
</main>

<script src="js/app.js"></script>
</body>
</html>
