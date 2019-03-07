<script lang="ts">
import jQuery from 'jquery'

import { onMount } from 'svelte'

import PaginationButtons from '@/common/PaginationButtons.svelte'
import langListRaw from './languages.json'
const langList = langListRaw

const NUM_PROBLEMS = 2 ** 19
const NUM_PROBLEMS_PER_PAGE = 10
const NUM_PROBLEM_PAGES = Math.ceil(NUM_PROBLEMS / NUM_PROBLEMS_PER_PAGE)
const PROBLEM_SPECIAL = 1337
const PROBLEM_SPECIAL_PAGE = Math.floor((NUM_PROBLEMS - PROBLEM_SPECIAL) / NUM_PROBLEMS_PER_PAGE) + 1

const NUM_USERS = 2 ** 34
const NUM_USERS_PER_PAGE = 10
const NUM_USER_PAGES = Math.ceil(NUM_USERS / NUM_USERS_PER_PAGE)

const PROBLEM_POINTS = 1000

const fakeSiteCreated = new Date(Date.now() - 86400000 * 365.25 * 10)

let problemsPage = $state(1)
let leaderboardPage = $state(1)

const problemNumbers = $derived(Array.from(numbersOnPageDesc(NUM_PROBLEMS, problemsPage, NUM_PROBLEMS_PER_PAGE)))
const leaderboardNumbers = $derived(Array.from(numbersOnPageAsc(NUM_USERS, leaderboardPage, NUM_USERS_PER_PAGE)))

function detrnd (seed: number, mod: number): number {
  return ((seed * 1103515245 + 12345) >>> 16) % mod
}

function* range (start: number, end?: number, step?: number) {
  if (end === undefined) {
    end = start
    start = 0
  }
  step ||= (start < end ? 1 : -1)

  for (
    let length = Math.max((end - start) / step, 0);
    length-- > 0;
    start += step) {
    yield start
  }
}

function* numbersOnPageAsc (total: number, page: number, numPerPage: number) {
  const start = 1 + (page - 1) * numPerPage
  const end = Math.min(start + numPerPage, total)
  yield* range(start, end)
}

function* numbersOnPageDesc (total: number, page: number, numPerPage: number) {
  const start = total - (page - 1) * numPerPage
  const end = Math.max(start - numPerPage, 0)
  yield* range(start, end)
}

function solvePoints (i: number): number { return Math.ceil(PROBLEM_POINTS / Math.log2(i + 1)) }

function userIdToName (i: number): string { return i === 1 ? 'Victor' : `user${i}` }
function userIdToPoints (i: number): number { return NUM_PROBLEMS * solvePoints(i) }

let problemsTab: HTMLElement | undefined = $state()
let leaderboardTab: HTMLElement | undefined = $state()
let problemTab: HTMLElement | undefined = $state()

let problemPageNum = $state(PROBLEM_SPECIAL)
let problemPageTextarea: HTMLTextAreaElement | undefined = $state()
let problemPageLang = $state('Python 3')
let problemPageHint = $state(0)
let problemPageRecent = $state(true)

let userModalUID = $state(1)

function showProblems (): void {
  jQuery(problemsTab!).tab('show')
}

function showLeaderboard (): void {
  jQuery(leaderboardTab!).tab('show')
}

function showProblem (num: number): void {
  problemPageNum = num
  jQuery(problemTab!).tab('show')
}

const blankFileLink = document.createElement('a')
blankFileLink.href = 'data:application/octet-stream,'
blankFileLink.download = 'submission'

function downloadBlankFile (): void {
  blankFileLink.click()
}

// hack to make Bootstrap's jQuery.fn.tab work
onMount(() => (window as any).jQuery ||= jQuery)
</script>

<ul class="nav nav-tabs nav-fill mb-3" role="tablist">
  <li class="nav-item">
    <a class="nav-link active" data-bs-toggle="tab" href="#home" role="tab" aria-controls="home" aria-selected="true">Home</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="problems-tab" bind:this={problemsTab} data-bs-toggle="tab" href="#problems" role="tab" aria-controls="problems" aria-selected="false">Problems</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="leaderboard-tab" bind:this={leaderboardTab} data-bs-toggle="tab" href="#leaderboard" role="tab" aria-controls="contact" aria-selected="false">Leaderboard</a>
  </li>
  <li class="nav-item d-none">
    <a class="nav-link" id="problem-tab" bind:this={problemTab} data-bs-toggle="tab" href="#problem" role="tab" aria-controls="problem" aria-selected="false">Problem</a>
  </li>
</ul>

<div class="tab-content">
  <div class="tab-pane show active" id="home" role="tabpanel" aria-labelledby="home-tab">
    <div class="p-5 mb-4 text-bg-light border rounded-3">
      <div class="container-fluid py-2">
        <h1 class="display-4">BestCoder</h1>
        <p class="lead">Be the best coder you can be; practice your skills on the most popular* programming contest practice site!</p>
        <hr class="my-4">
        <p>*We're probably the most popular with {NUM_PROBLEMS.toLocaleString()} problems and {NUM_USERS.toLocaleString()} users, who submitted {(NUM_PROBLEMS * NUM_USERS).toLocaleString()} solutions.</p>
        <div class="btn-group d-flex">
          <button class="btn btn-primary btn-lg w-100" onclick={showProblems}>Get Started</button>
          <button class="btn btn-secondary w-50" onclick={showLeaderboard}>Top Users</button>
        </div>
      </div>
    </div>
  </div>
  <div class="tab-pane" id="problems" role="tabpanel" aria-labelledby="problems-tab">
    <h2>Problems</h2>
    <p>Page <a href="#problemPage{PROBLEM_SPECIAL_PAGE}" onclick={(event) => (event.preventDefault(), problemsPage = PROBLEM_SPECIAL_PAGE)}>{PROBLEM_SPECIAL_PAGE}</a> is special.</p>
    <table class="table table-striped table-bordered table-hover">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Points</th>
          <th>Solved</th>
          <th>Attempted</th>
        </tr>
      </thead>
      <tbody>
        {#each problemNumbers as i}
          <tr>
            <td>{i.toLocaleString()}</td>
            <td><a href="#problem{i}" onclick={(event) => (event.preventDefault(), showProblem(i))}>Problem {i.toLocaleString()}{i === PROBLEM_SPECIAL ? ': Do Nothing' : ` (alias of #${PROBLEM_SPECIAL.toLocaleString()})`}</a></td>
            <td>{PROBLEM_POINTS.toLocaleString()}</td>
            <td>{NUM_USERS.toLocaleString()}</td>
            <td>{NUM_USERS.toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <PaginationButtons
      pageCur={problemsPage}
      pageMax={NUM_PROBLEM_PAGES}
      onSetPage={page => problemsPage = page} />
  </div>
  <div class="tab-pane" id="leaderboard" role="tabpanel" aria-labelledby="leaderboard-tab">
    <h2>Leaderboard</h2>
    <div class="alert alert-info" role="alert">
      <h4 class="alert-heading">Ranking Info</h4>
      Every user gets <code>ceil(w/lg(n+2))</code> points for each problem solved, where <code>w</code> is the weight of the problem, and <code>n</code> is the number of people who solved it earlier.
    </div>
    <ul class="nav nav-pills mb-2">
      <li class="nav-item">
        <a class="nav-link active" data-bs-toggle="pill" href="#leaderboard0">Last Century</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-bs-toggle="pill" href="#leaderboard1">Last Millenium</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-bs-toggle="pill" href="#leaderboard2">All Time</a>
      </li>
    </ul>
    <table class="table table-striped table-bordered table-hover">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Points</th>
          <th>Solved</th>
          <th>Attempted</th>
        </tr>
      </thead>
      <tbody>
        {#each leaderboardNumbers as i}
          <tr>
            <td>{i.toLocaleString()}</td>
            <td><a href="#user{i}" onclick={() => userModalUID = i} data-bs-toggle="modal" data-bs-target="#userModal">{userIdToName(i)}</a></td>
            <td>{userIdToPoints(i).toLocaleString()}</td>
            <td>{NUM_PROBLEMS.toLocaleString()}</td>
            <td>{NUM_PROBLEMS.toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <PaginationButtons
      pageCur={leaderboardPage}
      pageMax={NUM_USER_PAGES}
      onSetPage={page => leaderboardPage = page} />
  </div>
  <div class="tab-pane" id="problem" role="tabpanel">
    <h2>Problem #{problemPageNum.toLocaleString()}: Do Nothing{problemPageNum === PROBLEM_SPECIAL ? '' : ` (alias of #${PROBLEM_SPECIAL.toLocaleString()})`}</h2>

    <h3>Input</h3>
    <p>
      There is no input for this problem, 69% of the time.
      In the other 32%, the input is unspecified, and your program must handle it successfully.
      -1% of the time, we don't check the output and just allow solutions without checking.
    </p>

    <h3>Output</h3>
    <p>Exactly 0 bytes must be printed to standard output when the program terminates.</p>

    <div class="row">
      <div class="col-6">
        <h3>Sample Input 0</h3>
        <pre class="card card-body text-bg-light"></pre>
      </div>
      <div class="col-6">
        <h3>Sample Output 0</h3>
        <pre class="card card-body text-bg-light"></pre>
      </div>
    </div>

    <div class="row">
      <div class="col-6">
        <h3>Sample Input 1</h3>
        <pre class="card card-body text-bg-light">1337</pre>
      </div>
      <div class="col-6">
        <h3>Sample Output 1</h3>
        <pre class="card card-body text-bg-light"></pre>
      </div>
    </div>

    <h3>Code Editor</h3>
    <div class="mb-1">
      <select class="form-control" bind:value={problemPageLang}>
        {#each langList as lang}
          <option>{lang}</option>
        {/each}
      </select>
    </div>

    <div class="mb-2">
      <textarea class="form-control" bind:this={problemPageTextarea}># Enter your code here</textarea>
    </div>

    <div class="mb-2">
      <button class="btn btn-lg btn-primary" onclick={() => problemPageHint = problemPageTextarea!.value ? 2 : 3}>Submit</button>
      <button class="btn btn-secondary" onclick={() => problemPageHint = 1}>Hint</button>
    </div>

    {#if problemPageHint === 1}
      <div class="alert alert-info alert-dismissible" role="alert">
        <button class="btn-close" onclick={() => problemPageHint = 0} aria-label="Close"></button>
        Do the simplest thing that could possibly work.
      </div>
    {:else if problemPageHint === 2}
      <div class="alert alert-danger alert-dismissible" role="alert">
        <button class="btn-close" onclick={() => problemPageHint = 0} aria-label="Close"></button>
        <h4 class="alert-heading">Code size limit exceeded</h4>
        Try to solve this problem without wasting so much space!
      </div>
    {:else if problemPageHint === 3}
      <div class="alert alert-danger alert-dismissible" role="alert">
        <button class="btn-close" onclick={() => problemPageHint = 0} aria-label="Close"></button>
        <h4 class="alert-heading">Time Limit Exceeded</h4>
        You are too late, after waiting so long that {NUM_USERS.toLocaleString()} users solved it before you!
      </div>
    {/if}

    <h3>Past Submissions</h3>
    <ul class="nav nav-pills mb-2">
      <li class="nav-item">
        <a class="nav-link active" data-bs-toggle="pill" href="#problem_newest" onclick={() => problemPageRecent = true}>Newest</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-bs-toggle="pill" href="#problem_oldest" onclick={() => problemPageRecent = false}>Oldest</a>
      </li>
    </ul>
    <table class="table table-striped table-bordered table-hover">
      <thead>
        <tr>
          <th>User</th>
          <th>Run Time / &micro;s</th>
          <th>Submit Time</th>
          <th>Language</th>
          <th>Result</th>
          <th>Code</th>
        </tr>
      </thead>
      <tbody>
        {#each Array.from((problemPageRecent ? numbersOnPageDesc : numbersOnPageAsc)(NUM_USERS, 1, 5)) as i}
          <tr>
            <td><a href="#user{i}" onclick={() => userModalUID = i} data-bs-toggle="modal" data-bs-target="#userModal">{userIdToName(i)}</a></td>
            <td>0.000000</td>
            <td>{new Date(fakeSiteCreated.getTime() + i).toISOString()}</td>
            <td>{langList[detrnd(i + 5 * problemPageNum, langList.length)]}</td>
            <td>Accepted ({solvePoints(i)} points)</td>
            <td><button class="btn btn-outline-primary" onclick={downloadBlankFile}>Download</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<div class="modal fade" id="userModal" tabindex="-1" role="dialog" aria-labelledby="userModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="userModalTitle">User {userModalUID}: {userIdToName(userModalUID)}</h5>
        <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="d-flex">
          <div class="flex-shrink-0">
            <img src="https://gravatar.com/avatar/{userModalUID === 1 ? 'bc3ec022d71a5ec8e80990f198f9dc53' : userModalUID}?s=60&d=identicon" alt="avatar">
          </div>
          <div class="flex-grow-1 ms-3">
            <h5 class="mt-0">{userIdToName(userModalUID)}</h5>
            <p>Member since: {fakeSiteCreated.toLocaleString()}</p>
            <p>Submitted: {NUM_PROBLEMS.toLocaleString()}</p>
            <p>Solved: {NUM_PROBLEMS.toLocaleString()}</p>
            <p>Points: {userIdToPoints(userModalUID).toLocaleString()}</p>
            <p>Rank: {userModalUID.toLocaleString()}</p>
            <p>Rank History</p>
            <img src="https://quickchart.io/chart?cht=lc&chs=320x165&chxt=y&chxr=0,0,{userModalUID * 2}&chd=t:{userModalUID},{userModalUID}&chds=0,{userModalUID * 2}" alt="">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
