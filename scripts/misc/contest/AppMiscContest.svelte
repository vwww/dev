<script>
let problemsTab

const showProblems = () => jQuery(problemsTab).tab('show')
</script>

<ul class="nav nav-pills nav-fill" id="myTab" role="tablist">
  <li class="nav-item">
    <a class="nav-link active" id="home-tab" data-toggle="pill" href="#home" role="tab" aria-controls="home" aria-selected="true">Home</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="problems-tab" bind:this={problemsTab} data-toggle="pill" href="#problems" role="tab" aria-controls="problems" aria-selected="false">Problems</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="leaderboard-tab" data-toggle="pill" href="#leaderboard" role="tab" aria-controls="contact" aria-selected="false">Leaderboard</a>
  </li>
  <!--
  <li class="nav-item">
    <a class="nav-link" id="problem-tab" data-toggle="pill" href="#problem" role="tab" aria-controls="problem" aria-selected="false">Problem</a>
  </li>
  -->
</ul>
<div class="tab-content" id="myTabContent">
  <div class="tab-pane show active" id="home" role="tabpanel" aria-labelledby="home-tab">
    <p>Add a slogan here.</p>
    <button id="view-problems-test" class="btn btn-primary btn-block" on:click={showProblems}>View Problems</button>
  </div>
  <div class="tab-pane" id="problems" role="tabpanel" aria-labelledby="problems-tab">
    Problems <span id="view-problem-test" on:click={showProblems}>VIEW_PROBLEM_TEST</span>
  </div>
  <div class="tab-pane" id="leaderboard" role="tabpanel" aria-labelledby="leaderboard-tab">
    <div class="alert alert-info" role="alert">
      <h4 class="alert-heading">Data Management Policy</h4>
      To keep database costs low, only the top 1337 pages of pariticpants are indexed.
    </div>
    Last Century/Last Millenium/All Time
    <table id="leaderboard-table"></table>
  </div>
  <div class="tab-pane" id="problem" role="tabpanel">
    <h1>Problem Page</h1>

    Only a small set of languages are supported
    <br> More languages might be added in the future.
  </div>
</div>
