<script lang="ts">
import { shuffle } from '@/util'

const questions = [
  {
    q: 'LIVED is to DEVIL as 6323 is to',
    a: [
      [2336, 8],
      [6232, 3],
      [3236, 100],
      [3326, 9],
      [6332, 2]
    ]
  },
  {
    q: 'Which one of these is least like the other four?',
    a: [
      ['Horse', 40],
      ['Kangaroo', 100],
      ['Goat', 27],
      ['Deer', 25],
      ['Donkey', 45]
    ]
  }
]
questions.forEach(q => shuffle(q.a))
shuffle(questions)

let ageStr = $state('')

let resultType = $state(0)
let resultIQ = $state(0)
let iqRDetails: string | undefined = $state()
let iqRDesc: string | undefined = $state()
let iqRColor: string | undefined = $state()

// code below

function getAnswerValue (q: number): number {
  for (const option of document.getElementsByName('q' + q)) {
    const opt = option as HTMLInputElement
    if (opt.checked) {
      return +opt.value
    }
  }
  return -1
}

function validateAnswers (): void {
  // Process first question
  const q1r = getAnswerValue(0)
  if (q1r < 0) {
    resultType = 1
    return
  }
  // Process second question
  const q2r = getAnswerValue(1)
  if (q2r < 0) {
    resultType = 2
    return
  }

  // check age
  const age = parseFloat(ageStr)
  if (isNaN(age)) {
    resultType = 3
    return
  }

  // inputs are good
  resultIQ = (400 + q1r + q2r) / age
  resultType = 4

  if (resultIQ < 20) {
    iqRDetails = 'You are extremely retarded! Your IQ is less than 20!<br>"<b>Profound</b> mental retardation"'
    iqRDesc = 'Profoundly Retarded!'
    iqRColor = 'red'
  } else if (resultIQ < 35) {
    iqRDetails = 'You are really retarded! (IQ : 20 to 34)<br>"Severe mental retardation"'
    iqRDesc = 'Severely Retarded!'
    iqRColor = 'red'
  } else if (resultIQ < 50) {
    iqRDetails = 'You are retarded! (IQ : 35 to 49)<br>"Moderate mental retardation"'
    iqRDesc = 'Moderately Retarded!'
    iqRColor = 'red'
  } else if (resultIQ < 70) {
    iqRDetails = 'You are an idiot! You need to get smarter! (IQ : 50 to 69)<br>"Mild mental retardation"'
    iqRDesc = 'Idiot!'
    iqRColor = '#FFA200'
  } else if (resultIQ < 80) {
    iqRDetails = '"Borderline intellectual functioning" (IQ : 70 to 79)'
    iqRDesc = 'Enough to live'
    iqRColor = '#FFDE4'
  } else if (resultIQ < 92) {
    iqRDetails = 'Your IQ is lower than average! (IQ : 80 to 91)<br>So close to the "Borderline intellectual functioning" stage!'
    iqRDesc = 'Under Average!'
    iqRColor = '#CCF600'
  } else if (resultIQ < 115) {
    iqRDetails = 'Average Person (IQ : 92 to 114)'
    iqRDesc = 'Average'
    iqRColor = '#007929'
  } else if (resultIQ < 199) {
    iqRDetails = "You are smart, if you didn't cheat! (IQ : 115 to 200)"
    iqRDesc = 'Smart!'
    iqRColor = '#4284D3'
  } else { // (resultIQ >= 199)
    iqRDetails = 'Your IQ is higher than 200, you are absolutely, without a doubt, a genius!'
    iqRDesc = 'Genius!'
    iqRColor = '#8D41D6'
  }
}

function resetAnswers (): void {
  // reset answers, but not age
  resetAnswer(0)
  resetAnswer(1)

  resultType = 0

  function resetAnswer (q: number): void {
    document.getElementsByName('q' + q)
      .forEach((option) => {
        const opt = option as HTMLInputElement
        opt.checked = false
        ;(opt.parentNode as HTMLElement).classList.remove('active')
      })
  }
}
</script>

<div class="row">
  {#each questions as question, i}
    <div class="col-sm-4">
      <div class="card mb-3">
        <div class="card-header">
          <h2 class="card-title">Question {i + 1}</h2>
        </div>
        <div class="card-body">
          <p>{question.q}</p>
          <div class="btn-group-vertical" data-bs-toggle="buttons">
            {#each question.a as answer}
              <label class="btn btn-outline-secondary">
                <input type="radio" name="q{i}" value={answer[1]}> {answer[0]}
              </label>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/each}

  <div class="col-sm-4">
    <div class="card mb-3">
      <div class="card-header">
        <h2 class="card-title">Age</h2>
      </div>
      <div class="card-body">
        <label>
          You must enter your age in years (max 5 chars, use decimals)
          <input type="text" class="form-control" bind:value={ageStr} maxlength="5" placeholder="1337">
        </label>
      </div>
    </div>

    <div class="text-center">
      <div class="btn-group">
        <button onclick={validateAnswers} class="btn btn-primary">Validate</button>
        <button onclick={resetAnswers} disabled={!resultType} class="btn btn-danger">Reset</button>
      </div>
    </div>
  </div>

  <div class="col-12">
    <div class="card mb-3">
      <div class="card-header">
        <h2 class="card-title">Results</h2>
      </div>
      <div class="card-body">
        {#if !resultType}
          Results will appear here!
        {:else if resultType === 1}
          <h1>Answer the first question</h1>
        {:else if resultType === 2}
          <h1>Answer the second question</h1>
        {:else if resultType === 3}
          <h1>Your age is essential for getting your intelligence quotient</h1>
        {:else}
          <p><span style="font-size: 2em">Results:</span></p>
          <p><span style="font-size: 1.5em">Your IQ : <span style="color: {iqRColor}">{resultIQ}</span> / 100 (Average)</span></p>
          <h2> Your Rank: <span style="color: {iqRColor}">{iqRDesc}</span></h2>
          <p>
            <span style="font-size: 1.125em">
              {@html iqRDetails}
              <br>
              {#if resultIQ >= 92}
                <b>That is, <i>unless you cheated</i>, then <u>that's no good is it</u>?</b>
              {:else}
                <span style="font-size: 1em"><b>And this result might be fully accurate <i>if you truly believe it.</i></b></span>
              {/if}
            </span>
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>
