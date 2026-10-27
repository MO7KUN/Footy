// Historical records are sourced and dated separately from live feed data.
export const records = {
 'eng.1': {name:'Manchester United',titles:13,scope:'Premier League era, since 1992',source:'https://www.premierleague.com/en/news/4662306'},
 'esp.1': {name:'Real Madrid',titles:36,scope:'Spanish top-flight titles',source:'https://www.realmadrid.com/static/en/about-real-madrid/honours/football/'},
 'ita.1': {name:'Juventus',titles:36,scope:'Official Italian league championships',source:'https://www.legaseriea.it/serie-a/albo'},
 'ger.1': {name:'Bayern Munich',titles:34,scope:'Bundesliga era, since 1963',source:'https://www.bundesliga.com/en/bundesliga/news/bayern-munich-vfb-stuttgart-match-report-highlights-matchday-30-champions-davies-kane-36979'},
 'fra.1': {name:'Paris Saint-Germain',titles:14,scope:'French top-flight titles',source:'https://ligue1.com/en/articles/l1_article_5140-'},
 'uefa.champions': {name:'Real Madrid',titles:15,scope:'European Cup and Champions League',source:'https://www.uefa.com/uefachampionsleague/history/'},
 'uefa.europa': {name:'Sevilla',titles:7,scope:'UEFA Cup and Europa League',source:'https://www.uefa.com/uefaeuropaleague/history/'},
 'usa.1': {name:'LA Galaxy',titles:6,scope:'MLS Cup titles, not Supporters’ Shields',source:'https://www.lagalaxy.com/news/match-report-la-galaxy-claim-sixth-mls-cup-with-2-1-win-over-new-york-red-bulls-at-dignity-health-sports-park-on-saturday-night'},
 'ksa.1': {name:'Al Hilal',titles:19,scope:'League titles since 1976; excludes two earlier championships',source:'https://alhilal.com/en/honours'},
 'por.1': {name:'Benfica',titles:38,scope:'Portuguese top-flight league titles',source:'https://www.ligaportugal.pt/team/278/sl-benfica'}
};
export const recordDate='2026-10-27';
export const formats={
 'eng.1':'A home-and-away league season. Final points determine the champion, European qualification and relegation.',
 'esp.1':'A home-and-away league season. The final table determines the champion, European qualification and relegation.',
 'ita.1':'An Italian league season with home-and-away fixtures. League positions determine honours, qualification and relegation.',
 'ger.1':'A German home-and-away league competition with European qualification, relegation and a relegation play-off.',
 'fra.1':'A French home-and-away league season. The final table determines the champion and qualification places.',
 'uefa.champions':'A league phase followed by knockout play-offs and elimination rounds. Published ties appear in the knockout graph.',
 'uefa.europa':'A league phase followed by knockout play-offs and elimination rounds. Published ties appear in the knockout graph.',
 'usa.1':'Conference league tables followed by MLS Cup Playoffs. MLS Cup winners and regular-season table leaders are different honours.',
 'ksa.1':'Saudi Arabia’s top-flight league, played across a home-and-away season.',
 'por.1':'Portugal’s top-flight home-and-away league competition.'
};
