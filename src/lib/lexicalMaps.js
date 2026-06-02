/**
 * Static C1/C2 synonym maps for IELTS Writing lexical upgrade (fallback + merge with API).
 * Keys are lowercase headwords; match with word-boundary + inflection search in the essay.
 */

/** @typedef {{ c1: string[], c2: string[], c1_example?: string, c2_example?: string, collocation_hint?: string }} LexicalEntry */

/** @type {Record<string, LexicalEntry>} */
export const TASK1_LEXICAL = {
  increase: {
    c1: ['rise', 'grow'],
    c2: ['surge', 'soar'],
    c1_example: 'Sales rose steadily between 2010 and 2015.',
    c2_example: 'Consumption surged in the final quarter of the period.',
  },
  decrease: {
    c1: ['decline', 'drop'],
    c2: ['plummet', 'fall markedly'],
    c1_example: 'The figure declined gradually over the decade.',
    c2_example: 'Unemployment plummeted after 2018.',
  },
  show: {
    c1: ['indicate', 'reveal'],
    c2: ['illustrate', 'demonstrate'],
    c1_example: 'The table indicates a clear upward trend.',
    c2_example: 'The chart illustrates contrasting patterns in both regions.',
  },
  'go up': {
    c1: ['rise', 'increase'],
    c2: ['escalate', 'edge higher'],
    c1_example: 'Prices increased marginally in the first half of the year.',
    c2_example: 'Costs escalated during the final two years.',
  },
  'go down': {
    c1: ['fall', 'decrease'],
    c2: ['slide', 'trend downward'],
    c1_example: 'Production fell slightly in 2012.',
    c2_example: 'Output trended downward throughout the period.',
  },
  big: {
    c1: ['substantial', 'significant'],
    c2: ['considerable', 'marked'],
    c1_example: 'There was a substantial gap between the two categories.',
    c2_example: 'A marked difference emerged after 2005.',
  },
  small: {
    c1: ['modest', 'minor'],
    c2: ['marginal', 'slight'],
    c1_example: 'The change was modest overall.',
    c2_example: 'Only a slight fluctuation was observed.',
  },
  'a lot': {
    c1: ['considerably', 'significantly'],
    c2: ['substantially', 'markedly'],
    c1_example: 'The proportion grew considerably over twenty years.',
    c2_example: 'Spending increased substantially in urban areas.',
  },
  about: {
    c1: ['approximately', 'around'],
    c2: ['roughly', 'in the region of'],
    c1_example: 'Approximately one third of respondents chose option A.',
    c2_example: 'The figure stood at roughly 40% in 2020.',
  },
  get: {
    c1: ['reach', 'attain'],
    c2: ['amount to', 'stand at'],
    c1_example: 'The rate reached its peak in 2019.',
    c2_example: 'The total stood at just under 50%.',
  },
  change: {
    c1: ['shift', 'alter'],
    c2: ['fluctuate', 'vary'],
    c1_example: 'The pattern shifted noticeably after 2010.',
    c2_example: 'Figures fluctuated throughout the period.',
  },
  stable: {
    c1: ['unchanged', 'steady'],
    c2: ['plateau', 'level off'],
    c1_example: 'The percentage remained steady until 2015.',
    c2_example: 'Growth levelled off in the final years.',
  },
  peak: {
    c1: ['reach a high', 'top out'],
    c2: ['hit a peak', 'crest'],
    c1_example: 'Sales topped out in the third quarter.',
    c2_example: 'Demand crested in 2018 before declining.',
  },
  compare: {
    c1: ['contrast', 'relative to'],
    c2: ['by comparison', 'vis-à-vis'],
    c1_example: 'By contrast, the rural figure was far lower.',
    c2_example: 'Vis-à-vis 2000, the 2020 rate was almost double.',
  },
  number: {
    c1: ['figure', 'statistic'],
    c2: ['metric', 'data point'],
    c1_example: 'The figure for 2015 exceeded that of 2005.',
    c2_example: 'Each metric is expressed as a percentage.',
  },
  people: {
    c1: ['individuals', 'respondents'],
    c2: ['the population surveyed', 'participants'],
    c1_example: 'Respondents in urban areas reported higher uptake.',
    c2_example: 'Participants were grouped by age cohort.',
  },
  start: {
    c1: ['begin', 'commence'],
    c2: ['initiate', 'open at'],
    c1_example: 'The period commenced at around 20%.',
    c2_example: 'The series opened at a relatively low level.',
  },
  end: {
    c1: ['finish', 'conclude'],
    c2: ['close at', 'terminate'],
    c1_example: 'The trend concluded at approximately 70%.',
    c2_example: 'The line closed at its highest point.',
  },
  high: {
    c1: ['elevated', 'peak'],
    c2: ['a record high', 'the upper end'],
    c1_example: 'An elevated proportion was recorded in 2019.',
    c2_example: '2019 saw a record high for both regions.',
  },
  low: {
    c1: ['minimal', 'bottom'],
    c2: ['a trough', 'the lower end'],
    c1_example: 'The lowest figure was recorded in 2005.',
    c2_example: 'The series hit a trough in the mid-period.',
  },
  same: {
    c1: ['identical', 'unchanged'],
    c2: ['on a par with', 'equivalent to'],
    c1_example: 'Both lines remained identical until 2012.',
    c2_example: 'The two rates were equivalent throughout.',
  },
  different: {
    c1: ['distinct', 'divergent'],
    c2: ['markedly different', 'in contrast'],
    c1_example: 'The two trends were clearly divergent.',
    c2_example: 'The patterns were markedly different after 2010.',
  },
};

/** @type {Record<string, LexicalEntry>} */
export const TASK2_LEXICAL = {
  good: {
    c1: ['beneficial', 'positive'],
    c2: ['advantageous', 'conducive to'],
    c1_example: 'Public transport is beneficial for reducing congestion.',
    c2_example: 'Flexible hours can be conducive to productivity.',
  },
  bad: {
    c1: ['harmful', 'negative'],
    c2: ['detrimental', 'adverse'],
    c1_example: 'Screen time can be harmful to young children.',
    c2_example: 'Pollution has an adverse effect on public health.',
  },
  big: {
    c1: ['substantial', 'significant'],
    c2: ['considerable', 'profound'],
    c1_example: 'There is a significant difference between the two policies.',
    c2_example: 'Technology has had a profound impact on education.',
  },
  small: {
    c1: ['minor', 'limited'],
    c2: ['negligible', 'marginal'],
    c1_example: 'The change had only a minor effect on outcomes.',
    c2_example: 'The risk is negligible for most adults.',
  },
  things: {
    c1: ['factors', 'aspects'],
    c2: ['elements', 'dimensions'],
    c1_example: 'Several factors influence career choice.',
    c2_example: 'We must consider every dimension of the issue.',
  },
  stuff: {
    c1: ['material', 'matters'],
    c2: ['substance', 'affairs'],
    c1_example: 'Governments should regulate harmful material online.',
    c2_example: 'Public affairs require transparent decision-making.',
  },
  get: {
    c1: ['obtain', 'receive'],
    c2: ['acquire', 'attain'],
    c1_example: 'Students can obtain qualifications through distance learning.',
    c2_example: 'Workers may attain higher skills through training.',
  },
  very: {
    c1: ['highly', 'extremely'],
    c2: ['profoundly', 'remarkably'],
    c1_example: 'The policy is highly controversial in rural areas.',
    c2_example: 'Urban areas have changed remarkably over two decades.',
  },
  really: {
    c1: ['genuinely', 'particularly'],
    c2: ['decidedly', 'markedly'],
    c1_example: 'This issue is particularly relevant to young adults.',
    c2_example: 'Costs have risen markedly since the reform.',
  },
  like: {
    c1: ['enjoy', 'favour'],
    c2: ['have a preference for', 'be inclined toward'],
    c1_example: 'Many employers favour remote working arrangements.',
    c2_example: 'Consumers may be inclined toward sustainable products.',
  },
  make: {
    c1: ['cause', 'lead to'],
    c2: ['give rise to', 'precipitate'],
    c1_example: 'Poverty can lead to poorer educational outcomes.',
    c2_example: 'Automation may give rise to short-term unemployment.',
  },
  use: {
    c1: ['employ', 'utilise'],
    c2: ['leverage', 'deploy'],
    c1_example: 'Schools should utilise technology responsibly.',
    c2_example: 'Firms can leverage data to improve services.',
  },
  lot: {
    c1: ['a considerable amount', 'numerous'],
    c2: ['a substantial proportion', 'a significant share'],
    c1_example: 'Numerous studies support this conclusion.',
    c2_example: 'A significant share of emissions comes from transport.',
  },
  way: {
    c1: ['manner', 'means'],
    c2: ['mechanism', 'avenue'],
    c1_example: 'Education is a means of reducing inequality.',
    c2_example: 'Tax reform offers one avenue for funding services.',
  },
  nowadays: {
    c1: ['currently', 'in modern society'],
    c2: ['in the contemporary era', 'at present'],
    c1_example: 'Currently, many families rely on dual incomes.',
    c2_example: 'At present, digital skills are essential in most jobs.',
  },
  money: {
    c1: ['funding', 'finance'],
    c2: ['financial resources', 'capital'],
    c1_example: 'Adequate funding is needed for public healthcare.',
    c2_example: 'Start-ups require sufficient capital to expand.',
  },
  people: {
    c1: ['individuals', 'citizens'],
    c2: ['the populace', 'members of society'],
    c1_example: 'Citizens should participate in local decision-making.',
    c2_example: 'Members of society bear shared responsibility.',
  },
  think: {
    c1: ['believe', 'argue'],
    c2: ['contend', 'maintain'],
    c1_example: 'Some experts argue that tourism harms ecosystems.',
    c2_example: 'Proponents maintain that the benefits outweigh the costs.',
  },
  believe: {
    c1: ['hold that', 'argue'],
    c2: ['maintain', 'assert'],
    c1_example: 'Critics hold that the policy is unfair.',
    c2_example: 'Advocates assert that reform is long overdue.',
  },
  happy: {
    c1: ['content', 'satisfied'],
    c2: ['fulfilled', 'at ease'],
    c1_example: 'Employees who feel satisfied tend to stay longer.',
    c2_example: 'A fulfilling career supports mental wellbeing.',
  },
  sad: {
    c1: ['unhappy', 'distressed'],
    c2: ['disheartened', 'despondent'],
    c1_example: 'Isolated workers may feel distressed over time.',
    c2_example: 'Repeated failure can leave learners disheartened.',
  },
  important: {
    c1: ['crucial', 'vital'],
    c2: ['pivotal', 'paramount'],
    c1_example: 'Critical thinking is crucial in higher education.',
    c2_example: 'Safety remains paramount in industrial design.',
  },
  problem: {
    c1: ['issue', 'challenge'],
    c2: ['predicament', 'hurdle'],
    c1_example: 'Climate change poses a major challenge for governments.',
    c2_example: 'Funding remains a hurdle for small charities.',
  },
  help: {
    c1: ['assist', 'support'],
    c2: ['facilitate', 'bolster'],
    c1_example: 'Grants can assist low-income families with housing.',
    c2_example: 'Training programmes facilitate career progression.',
  },
  need: {
    c1: ['require', 'necessitate'],
    c2: ['demand', 'call for'],
    c1_example: 'Urban growth will require better infrastructure.',
    c2_example: 'The crisis calls for immediate international cooperation.',
  },
  want: {
    c1: ['wish', 'desire'],
    c2: ['aspire to', 'seek to'],
    c1_example: 'Many graduates wish to work abroad.',
    c2_example: 'Governments seek to attract foreign investment.',
  },
  many: {
    c1: ['numerous', 'a wide range of'],
    c2: ['a plethora of', 'myriad'],
    c1_example: 'Numerous countries have adopted carbon taxes.',
    c2_example: 'There are myriad reasons for rural depopulation.',
  },
  some: {
    c1: ['certain', 'several'],
    c2: ['a subset of', 'a proportion of'],
    c1_example: 'Certain groups remain underrepresented in STEM.',
    c2_example: 'A proportion of revenue should fund research.',
  },
  also: {
    c1: ['furthermore', 'moreover'],
    c2: ['in addition', 'equally'],
    c1_example: 'Furthermore, the policy may widen regional inequality.',
    c2_example: 'Equally, cultural factors shape consumer behaviour.',
  },
  because: {
    c1: ['since', 'as'],
    c2: ['owing to', 'on account of'],
    c1_example: 'Since costs have risen, demand has fallen.',
    c2_example: 'On account of inflation, savings have lost value.',
  },
  so: {
    c1: ['therefore', 'thus'],
    c2: ['consequently', 'hence'],
    c1_example: 'Therefore, stricter regulation may be justified.',
    c2_example: 'Hence, both sides should compromise.',
  },
  kids: {
    c1: ['children', 'young people'],
    c2: ['minors', 'the younger generation'],
    c1_example: 'Children benefit from early language exposure.',
    c2_example: 'The younger generation faces unprecedented housing costs.',
  },
  old: {
    c1: ['elderly', 'aged'],
    c2: ['senior citizens', 'the elderly population'],
    c1_example: 'Elderly residents need accessible public transport.',
    c2_example: 'Senior citizens often rely on state pensions.',
  },
  new: {
    c1: ['novel', 'recent'],
    c2: ['innovative', 'emerging'],
    c1_example: 'Recent evidence challenges earlier assumptions.',
    c2_example: 'Emerging markets offer growth opportunities.',
  },
  great: {
    c1: ['considerable', 'substantial'],
    c2: ['exceptional', 'outstanding'],
    c1_example: 'There is considerable pressure on public services.',
    c2_example: 'She made an outstanding contribution to the project.',
  },
  nice: {
    c1: ['pleasant', 'appealing'],
    c2: ['attractive', 'desirable'],
    c1_example: 'Green spaces make cities more appealing.',
    c2_example: 'Flexible hours are desirable for many employees.',
  },
  hard: {
    c1: ['difficult', 'challenging'],
    c2: ['arduous', 'demanding'],
    c1_example: 'It is difficult to balance work and study.',
    c2_example: 'Manual roles can be physically demanding.',
  },
  easy: {
    c1: ['straightforward', 'simple'],
    c2: ['effortless', 'uncomplicated'],
    c1_example: 'The procedure is straightforward for applicants.',
    c2_example: 'Online booking has made travel uncomplicated.',
  },
  always: {
    c1: ['consistently', 'invariably'],
    c2: ['without exception', 'perpetually'],
    c1_example: 'Prices do not invariably reflect true value.',
    c2_example: 'Regulations cannot perpetually lag behind technology.',
  },
  never: {
    c1: ['rarely', 'seldom'],
    c2: ['not once', 'under no circumstances'],
    c1_example: 'Governments seldom act without public pressure.',
    c2_example: 'Privacy should under no circumstances be traded for profit.',
  },
  often: {
    c1: ['frequently', 'commonly'],
    c2: ['in many cases', 'more often than not'],
    c1_example: 'Stress is frequently linked to long working hours.',
    c2_example: 'In many cases, prevention is cheaper than treatment.',
  },
  say: {
    c1: ['state', 'claim'],
    c2: ['assert', 'maintain'],
    c1_example: 'Researchers state that diet affects longevity.',
    c2_example: 'Critics maintain that the law is outdated.',
  },
  know: {
    c1: ['recognise', 'understand'],
    c2: ['acknowledge', 'be aware that'],
    c1_example: 'Policymakers must recognise cultural diversity.',
    c2_example: 'We should acknowledge that progress takes time.',
  },
  'in my opinion': {
    c1: ['in my view', 'I would argue that'],
    c2: ['from my perspective', 'it seems to me that'],
    c1_example: 'In my view, education should remain publicly funded.',
    c2_example: 'It seems to me that both approaches have merit.',
  },
  'i think': {
    c1: ['I believe', 'I would argue that'],
    c2: ['I contend', 'it appears that'],
    c1_example: 'I believe that tourism can support conservation.',
    c2_example: 'I contend that the benefits outweigh the drawbacks.',
  },
};

/** Fallback weak words when API returns nothing (highlighting in essay editor). */
export const WEAK_WORDS_FALLBACK = [
  'good', 'bad', 'big', 'small', 'things', 'stuff', 'get', 'very', 'really', 'like',
  'make', 'use', 'lot', 'nowadays', 'money', 'people', 'think', 'believe',
  'increase', 'show', 'about', 'important', 'problem', 'kids', 'say',
];
