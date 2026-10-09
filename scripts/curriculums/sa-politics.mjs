// Builds the South African Politics curriculum.
//
// Source: scripts/curriculums/sa-politics.md. Designed, with the first five
// stages backed by the library on hand — Thompson, both Cambridge volumes,
// Feinstein, Evans — and the present covered by primary documents, because the
// library is strong to 1994 and holds nothing after it.
//
// EVERY LESSON CARRIES ITS SUBSTANCE. A name alone makes a curriculum an
// index: "The 1913 Natives Land Act" says what to look up and not what it did
// or why it is the hinge everything after turns on. The detail is the lesson;
// the name is its label.
//
// Prints SQL. Nothing is executed here.

const SOURCE = 'scripts/curriculums/sa-politics.md';

const stages = [
  {
    name: '1 · How to read it',
    lessons: [
      [
        'Establish what a source is before reading it for facts',
        `Every account of this subject is written from inside a commitment, so the first question is never "is this true" but "what is this doing".

Place each source before using it:
· Thompson — liberal historian, 4th edition, narrative and fair but with a visible view of what progress looks like.
· Cambridge vols 1-2 — academic consensus, multi-author, an editorial line you can see if you compare chapters.
· Feinstein — economic historian; treats discrimination as a material system producing measurable outcomes rather than as attitudes.
· Afrikaner nationalist history and liberation history — both are PRIMARY sources about their own movements as much as accounts of events.

None of that makes a source unusable. It makes it readable.`,
      ],
      [
        'The four big disagreements',
        `Know these before reading, because every book takes a side and most do not announce it:

1. Was apartheid a continuation of segregation or a break with it? (Determines whether 1948 matters much.)
2. Did apartheid fall to internal resistance, economic failure, or the end of the Cold War? Each answer implies a different politics now.
3. Was the negotiated settlement a victory or a compromise that left economic power untouched? The live argument in South African politics.
4. Is the post-1994 state's failure a matter of corruption or of design? Zondo answers the first and not the second.`,
      ],
      [
        'Read one chapter three ways',
        `Take the mineral revolution — Thompson, Cambridge vol. 2, and Feinstein all cover it.

Read all three on the same events and write down, in one line each: what each author thinks the mineral revolution WAS. Thompson will say it transformed a society; Feinstein will say it created a labour system. Both are right and they are not the same claim.

This exercise is the method for the whole curriculum.`,
      ],
    ],
  },
  {
    name: '2 · Before 1652',
    lessons: [
      [
        'Who was here — Khoe, San, and the Bantu-speaking polities',
        `Cambridge vol. 1 is the source; Thompson's first chapter is the summary.

· San — hunter-gatherers, present for tens of thousands of years, the oldest continuous human occupation anywhere.
· Khoekhoe — pastoralists, cattle and sheep, in the west and south.
· Bantu-speaking farming societies — iron-working, cattle-keeping, settled in the east and north from roughly the 3rd century AD. NOT recent arrivals, which is the political point.

Mapungubwe (c. 1075-1220) and Great Zimbabwe are the evidence that complex states existed here long before any European arrived.`,
      ],
      [
        'Why "empty land" was a claim, not a fact',
        `The argument that Bantu-speakers and Dutch settlers "arrived at the same time" was official history for decades and is still repeated. It mattered because it made conquest look like settlement of vacant territory rather than dispossession.

It is wrong on the archaeology: farming societies were east of the Kei by roughly 300 AD, more than a millennium before 1652.

Worth knowing precisely, because this is the single most load-bearing historical falsehood in South African politics and it will come up.`,
      ],
      [
        'The Mfecane and what it is used for',
        `The upheavals of the 1810s-1830s, associated with Shaka and the rise of the Zulu kingdom.

Two readings, and both are political:
· Traditional — internal African wars depopulated the interior, which conveniently explains why the Voortrekkers found land empty.
· Revisionist (Cobbing and after) — the disruption was driven substantially by slave-raiding and the Delagoa Bay trade, i.e. by external pressure, and "depopulation" was overstated.

Cambridge vol. 1 covers the debate. The point is not to settle it but to see that the same events support two incompatible political stories.`,
      ],
    ],
  },
  {
    name: '3 · Conquest and colonies, 1652-1910',
    lessons: [
      [
        '1652 and the Dutch Cape — a refreshment station that became a colony',
        `Van Riebeeck lands for the VOC: the point was provisioning ships, not settlement. It became settlement anyway.

Three things to carry forward:
· Slavery at the Cape from 1658 — from Indonesia, India, Madagascar and Mozambique, not internally. This is the origin of the Cape's creole society and of Afrikaans.
· The frontier of expansion was driven by the trekboers, semi-nomadic pastoralists, beyond VOC control.
· The Khoekhoe were destroyed as independent societies by dispossession, war and the smallpox epidemics of 1713 and 1755.`,
      ],
      [
        'British rule, the frontier wars, and emancipation',
        `British occupation 1795, permanent from 1806.

· Nine frontier wars against the Xhosa, 1779-1879 — the longest sustained resistance to colonial conquest in Africa.
· Slavery abolished 1834. Compensation went to owners, not the enslaved; the grievance fed Afrikaner nationalism for a century.
· The Great Trek from 1836 — the founding story of Afrikaner nationalism, and worth reading as that as much as an event.
· Natal, the Orange Free State, the Transvaal: four polities by mid-century, two British and two Boer republics.`,
      ],
      [
        'The mineral revolution — diamonds 1867, gold 1886',
        `Feinstein is the essential source here, and this is the hinge of the whole history.

Gold on the Witwatersrand was deep-level and low-grade: profitable only with enormous capital and very cheap labour at scale. That requirement — not prejudice alone — built the system:
· Migrant labour, recruited across southern Africa
· Compounds, pass controls, and the colour bar in skilled work
· A state whose job was delivering labour to mines at a controlled price

Read this and the 20th century stops being a story about attitudes and becomes one about a labour system that needed laws.`,
      ],
      [
        'The South African War, 1899-1902',
        `Evans is the dedicated source.

· Britain against the two Boer republics; about gold and imperial control of it.
· Scorched earth and concentration camps — roughly 28,000 Boer and at least 20,000 black deaths in them. The camps are a live memory in Afrikaner politics.
· Black South Africans fought and laboured on both sides and gained nothing from either.
· Ended at Vereeniging, 1902. The peace deliberately deferred the question of black political rights.`,
      ],
      [
        'Union, 1910 — the deal that excluded almost everyone',
        `The four colonies become one state. The settlement reconciled British and Afrikaner whites with each other by agreeing to exclude black South Africans from the new polity.

The Cape kept a qualified non-racial franchise; the other three did not; and it was entrenched only weakly enough to be removed later, which it was.

1910 is where the apartheid state's architecture starts, 38 years before the National Party wins anything.`,
      ],
    ],
  },
  {
    name: '4 · Segregation to apartheid, 1910-1948',
    lessons: [
      [
        'The 1913 Natives Land Act',
        `The single most consequential law in South African history, and it predates apartheid by 35 years.

It restricted black land ownership to scheduled "reserves" — about 7% of the country, later 13%. It destroyed the independent black peasantry and share-cropping, and it manufactured the migrant labour supply the mines needed.

Everything about the 20th century land question, and the present one, starts here. Sol Plaatje's Native Life in South Africa (1916) is the contemporary account.`,
      ],
      [
        'The architecture built before 1948',
        `The point of this stage: the legal machinery was substantially in place before the National Party took power. Know these by name —

· Mines and Works Act 1911 — the colour bar in skilled work
· Natives Land Act 1913
· Natives (Urban Areas) Act 1923 — cities as white space, black residence as temporary and permitted
· Industrial Conciliation Act 1924 — black workers excluded from recognised unions
· Representation of Natives Act 1936 — removed Cape African voters from the common roll

Which is why the first of the four big disagreements matters: if all this existed already, what exactly did 1948 change?`,
      ],
      [
        'The ANC before it was a liberation movement',
        `Founded 1912 as the South African Native National Congress, largely by mission-educated professionals, and for decades a petitioning organisation — deputations to London, appeals to constitutional propriety.

It did not become a mass movement until the 1940s, when the Youth League (Mandela, Sisulu, Tambo, Lembede) pushed it toward confrontation.

Worth knowing because the ANC's own history is used politically in both directions, and the moderate phase is usually left out of both versions.`,
      ],
      [
        'Afrikaner nationalism as a project',
        `Treat it as a deliberately built movement rather than a mood:

· Poor-white impoverishment after the war and the 1922 Rand Revolt
· The Broederbond from 1918; Afrikaans standardised and promoted as a language of state
· Christian-national education, and a theology recruited to justify separateness
· Economic institutions — Sanlam, Volkskas — built to move Afrikaners into capital
· 1938's centenary of the Great Trek as mass political theatre

By 1948 this was an organised bloc with a programme, which is why it won.`,
      ],
    ],
  },
  {
    name: '5 · The apartheid state, 1948-1990',
    lessons: [
      [
        '1948 and what was actually new',
        `The National Party wins a parliamentary majority on a minority of votes.

What was new was not segregation but SYSTEM: comprehensive, classified by statute, enforced bureaucratically, and aimed at permanent separation rather than ad hoc control.

· Population Registration Act 1950 — everyone legally classified by race
· Group Areas Act 1950 — residential segregation by law, and mass removals
· Suppression of Communism Act 1950 — the instrument used against all opposition
· Bantu Education Act 1953 — Verwoerd's explicit intent that education fit people for subordinate roles
· Pass laws consolidated 1952

Answer the first big disagreement for yourself here, with the laws in front of you.`,
      ],
      [
        'Grand apartheid and the homelands',
        `Verwoerd's version: not just segregation but the removal of black South Africans from South African citizenship altogether, by making them citizens of "independent" homelands.

Transkei 1976, Bophuthatswana 1977, Venda 1979, Ciskei 1981 — recognised by no one but each other and Pretoria. Around 3.5 million people were forcibly removed.

The purpose was to make a black majority into a set of foreign minorities. Understanding this explains why the post-1994 state inherited the territorial and administrative mess it did.`,
      ],
      [
        'Resistance: 1952 to 1976 to 1985',
        `The sequence matters more than the names.

· Defiance Campaign 1952; Freedom Charter 1955; Treason Trial
· Sharpeville 1960 — 69 killed; ANC and PAC banned; the turn to armed struggle (MK, Poqo)
· Rivonia 1963-64 — the leadership imprisoned, and roughly a decade of relative quiet inside the country
· Black Consciousness and Biko through the early 1970s; Durban strikes 1973
· Soweto 1976 — the schools revolt, triggered by Afrikaans as a medium of instruction; the point the state lost the next generation
· UDF 1983, ungovernability, states of emergency 1985-86`,
      ],
      [
        'The economy that could not continue',
        `Feinstein again. Apartheid worked economically for a while and then stopped.

· Growth to the early 1970s, then stagnation
· The colour bar starved the economy of skilled labour it had forbidden itself to train
· Sanctions, disinvestment, and the 1985 debt standstill
· Capital flight and the cost of the security state and the border war

This is the second big disagreement in concrete form: how much of the collapse was resistance and how much arithmetic.`,
      ],
      [
        'The security state and the border war',
        `· Total Onslaught / Total Strategy doctrine; the State Security Council effectively governing
· Detention without trial, torture, death squads — later documented by the TRC
· Angola and Namibia, Cuito Cuanavale 1988, and conscription as a formative experience for a white generation
· Destabilisation of Mozambique, Angola, Zimbabwe — regional costs still visible

Read this to understand why the negotiated settlement included amnesty, and why that remains contested.`,
      ],
    ],
  },
  {
    name: '6 · The transition, 1990-1996',
    lessons: [
      [
        'February 1990 to the first vote',
        `· De Klerk unbans the ANC, SACP and PAC; Mandela released 11 February 1990
· CODESA 1 and 2, 1991-92, and their collapse
· Boipatong and Bisho, 1992 — the violence that nearly ended it
· Record of Understanding; Chris Hani assassinated April 1993, and the decision to accelerate rather than abandon
· Interim Constitution 1993, with 34 entrenched principles the final one had to satisfy
· 27 April 1994 — ANC 62.65%, a Government of National Unity

Roughly 14,000 people died in political violence between 1990 and 1994. The transition was not peaceful; it was negotiated.`,
      ],
      [
        'What was conceded, and by whom',
        `The third big disagreement, and the live one in current politics.

The ANC obtained universal franchise, a justiciable Bill of Rights, and state power. It did not obtain — and largely stopped seeking — nationalisation, land redistribution at scale, or any change in the ownership of the economy. Property rights were constitutionally protected; the Reserve Bank kept its independence; sunset clauses protected the existing civil service.

Whether that was statesmanship or capitulation is the question underneath the EFF's existence, the land debate, and much of the ANC's internal conflict. Know the terms of it precisely enough to follow the argument.`,
      ],
      [
        'The TRC',
        `Amnesty in exchange for full disclosure, chaired by Tutu, reporting 1998.

What it achieved: an authoritative public record that the state had tortured and murdered, which could no longer be denied.
What it did not: prosecutions, meaningful reparations, or accountability for those who simply declined to appear.

Read the critique as seriously as the defence. The TRC is the clearest case of the transition's central trade — truth for accountability — and opinions on it track opinions on the settlement as a whole.`,
      ],
    ],
  },
  {
    name: '7 · The constitutional order',
    lessons: [
      [
        'Read the Constitution itself',
        `Not a book about it. It is free, it is roughly 150 pages, and almost nobody arguing about it has read it.

Read in this order:
· Chapter 1 — founding provisions, and section 1's values
· Chapter 2 — the Bill of Rights, and particularly s7-s9 (equality), s25 (property), s26-s29 (housing, health, food, water, social security, education)
· Chapter 3 — co-operative government
· s36 — the limitations clause, which is how every rights argument is actually decided

s25 and s36 are where the land and policy arguments live. Read them before accepting anybody's account of what they say.`,
      ],
      [
        'How the state is actually built',
        `· Three spheres — national, provincial, local — co-operative rather than hierarchical, which is why accountability is hard to locate
· Parliament: National Assembly and National Council of Provinces; proportional representation with closed lists, so MPs answer to parties and not to voters
· An executive drawn from the legislature; a President elected by the Assembly, not directly
· Chapter 9 institutions — Public Protector, Auditor-General, Human Rights Commission, Electoral Commission: independent by design, variably so in practice

The closed-list PR system is worth dwelling on. It explains a great deal about why party discipline overrides constituency interest.`,
      ],
      [
        'The courts, and what they have decided',
        `The Constitutional Court is the most consequential institution in the country's post-1994 history. Read the judgments, which are written to be readable:

· Makwanyane (1995) — the death penalty, and the Court's method established
· Grootboom (2000) — socio-economic rights are justiciable but require reasonable programmes, not immediate delivery
· Treatment Action Campaign (2002) — the Court against the government on HIV treatment, and it won
· Glenister (2011) — the state must maintain an independent anti-corruption body
· Nkandla (2016) — the Public Protector's remedial action binds; the President had failed his oath

The pattern worth seeing: the Court has repeatedly been the institution that worked when others did not, which is both reassuring and a symptom.`,
      ],
    ],
  },
  {
    name: '8 · The present',
    lessons: [
      [
        'Mandela to Mbeki to Zuma',
        `· 1994-99 Mandela: reconciliation prioritised; RDP replaced by GEAR in 1996, a decisively orthodox macroeconomic turn
· 1999-2008 Mbeki: growth and a black middle class; AIDS denialism, with excess-death estimates in the hundreds of thousands; arms deal corruption begins the pattern
· 2007 Polokwane — Zuma defeats Mbeki for the party presidency, and the party's internal contest becomes the country's politics
· 2009-2018 Zuma: state capture proper; Nkandla; Gupta networks; Marikana 2012, where police killed 34 striking miners and the post-1994 state's claim on labour's loyalty broke`,
      ],
      [
        'State capture and Zondo',
        `The Commission reports are free and are the most detailed account of how a state is hollowed out from inside. Do not read all of them; read the executive summaries and one sector in full.

The mechanism to understand: capture was not primarily theft of cash. It was the deliberate placement of compliant people in procurement, SOEs and prosecution — Eskom, Transnet, SARS, the NPA — so that stealing became lawful-looking and prosecution impossible.

Eskom is the one to read in full, because load-shedding is the most visible consequence of anything in this curriculum.`,
      ],
      [
        'The economy as it is',
        `From Stats SA, not from commentary. Know the actual figures and when they were measured:

· Unemployment on the official definition, and the expanded definition that includes discouraged workers — the gap between them is itself political
· Youth unemployment specifically
· A Gini coefficient among the highest measured anywhere
· Land ownership figures, and how contested the measurement is
· Electricity availability and the cost of load-shedding

The habit to build: find the primary release before accepting a number from an argument.`,
      ],
      [
        '2024 and the coalition',
        `The ANC falls below 50% for the first time — roughly 40% — and forms a Government of National Unity with the DA and others.

Why it matters structurally: thirty years of single-party dominance ends, and coalition government becomes the normal case. Local government has worked this way for years, mostly badly, which is the available evidence for how it may go nationally.

Follow this as it happens rather than reading about it later. It is the first stretch of this history you are living through with the context to understand it.`,
      ],
      [
        'The live arguments, stated fairly',
        `Be able to state each of these in the terms its own advocates use, before disagreeing:

· Land reform — expropriation without compensation, s25, restitution versus redistribution, and whether the constraint has ever actually been the Constitution
· BEE and affirmative action — redress versus elite enrichment, and what the evidence says
· Cadre deployment — party loyalty against professional administration
· The National Health Insurance scheme
· Federalism and provincial powers, including Western Cape autonomy arguments
· Immigration and the politics of xenophobia

If you cannot state a position in a way its holders would accept, you do not understand it yet.`,
      ],
      [
        'Keep reading it',
        `Ongoing, which is the point of this stage:

· Read Constitutional Court judgments as they come down — the summaries are short
· Follow the Auditor-General's reports on municipalities
· Check a claim against a Stats SA release once a week
· Read something you expect to disagree with, monthly, and state its argument before rejecting it`,
      ],
    ],
  },
];

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const out = [
  '-- Generated by scripts/curriculums/sa-politics.mjs. Read before running.',
  // Rebuildable without losing its place. The row is created only if it is
  // not already there, and its modules are cleared instead — deleting the
  // curriculum and reinserting it would take a new position at the end, and
  // curriculum order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select 'South African politics', ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(new Date().toISOString())}\n` +
    `  where not exists (select 1 from curriculums where name = 'South African politics');`,
  `update curriculums set source = ${q(SOURCE)} where name = 'South African politics';`,
  // Lessons first, then modules. ON DELETE CASCADE covers this wherever foreign
  // keys are enforced — D1 enforces them — and silently does nothing where they
  // are not, orphaning every lesson instead of removing it so that a rebuild
  // quietly adds a second full set nobody can see, because every read joins
  // through modules. Written out rather than relied upon.
  `delete from lessons where module_id in\n` +
    `  (select id from modules where curriculum_id =\n` +
    `     (select id from curriculums where name = 'South African politics'));`,
  `delete from modules where curriculum_id =\n` +
    `  (select id from curriculums where name = 'South African politics');`,
];

stages.forEach((stage, m) => {
  out.push(
    `insert into modules (curriculum_id, name, position)\n` +
      `  values ((select id from curriculums where name = 'South African politics'), ${q(stage.name)}, ${m + 1});`,
  );
  stage.lessons.forEach(([name, detail], l) => {
    out.push(
      `insert into lessons (module_id, name, position, on_route, detail)\n` +
        `  values ((select max(id) from modules), ${q(name)}, ${l + 1}, 1, ${q(detail)});`,
    );
  });
});

console.log(out.join('\n'));
console.error(
  `modules: ${stages.length}  lessons: ${stages.reduce((n, s) => n + s.lessons.length, 0)}`,
);
