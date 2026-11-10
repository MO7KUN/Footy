// Historical records are sourced and dated separately from live feed data.
export const domesticCups = [
 ['eng.fa','FA Cup','England','FA','cup'],
 ['esp.copa_del_rey','Copa del Rey','Spain','CDR','cup'],
 ['ita.coppa_italia','Coppa Italia','Italy','CI','cup'],
 ['ger.dfb_pokal','DFB-Pokal','Germany','DFB','cup'],
 ['fra.coupe_de_france','Coupe de France','France','CDF','cup']
];

export const internationalCompetitions = [
 ['fifa.world','FIFA World Cup','World','WC','tournament'],
 ['uefa.euro','UEFA European Championship','Europe','EURO','tournament'],
 ['uefa.nations','UEFA Nations League','Europe','UNL','tournament'],
 ['conmebol.america','Copa América','South America','CA','tournament'],
 ['caf.nations','Africa Cup of Nations','Africa','AFCON','tournament'],
 ['afc.asian.cup','AFC Asian Cup','Asia','AFC','tournament'],
 ['concacaf.gold','Concacaf Gold Cup','North & Central America','GC','tournament'],
 ['concacaf.nations.league','Concacaf Nations League','North & Central America','CNL','tournament'],
 ['fifa.wwc',"FIFA Women's World Cup",'World','WWC','tournament'],
 ['uefa.weuro',"UEFA Women's Euro",'Europe','WE','tournament'],
 ...[
  ['uefa','Europe','UEFA'],['conmebol','South America','CONMEBOL'],['caf','Africa','CAF'],
  ['afc','Asia','AFC'],['concacaf','North & Central America','Concacaf'],['ofc','Oceania','OFC']
 ].map(([slug,region,federation])=>['fifa.worldq.'+slug,'World Cup Qualifying · '+federation,region,federation,'qualifier']),
 ['fifa.friendly','International Friendlies','World','INT','friendly'],
 ['fifa.friendly.w',"Women's International Friendlies",'World','WINT','friendly'],
 ['club.friendly','Club Friendlies','World','CF','friendly']
];

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
