import { $idA, $ready } from './util'

$ready(function () {
  const $$problemsTab = $('#problems-tab')
  $idA('view-problems-test').addEventListener('click', () => $$problemsTab.tab('show'))
  $idA('view-problem-test').addEventListener('click', () => $$problemsTab.tab('show'))
})
