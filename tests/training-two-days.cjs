const assert=require('node:assert/strict'),{buildSync}=require('esbuild'),vm=require('node:vm'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const RealDate=Date;class FixedDate extends RealDate{constructor(...args){super(...(args.length?args:['2026-11-09T03:00:00Z']));}static now(){return new RealDate('2026-11-09T03:00:00Z').getTime();}}
function load(file){const module={exports:{}};vm.runInNewContext(buildSync({entryPoints:[file],bundle:true,platform:'node',format:'cjs',external:['react','react-dom'],write:false}).outputFiles[0].text,{module,exports:module.exports,require,console,Date:FixedDate,Intl});return module.exports;}
const {TrainingCalendar}=load('src/components/TrainingCalendar.tsx'),{demoTraining}=load('src/services/demoTraining.ts');const report=demoTraining().report;
function render(mode,calendar=report.calendar){return renderToStaticMarkup(React.createElement(TrainingCalendar,{data:calendar,snapshotId:report.snapshotId,demo:true,mode}));}
const html=render('training'),expected=report.calendar.events.filter(e=>!e.cancelled&&['2026-11-09','2026-11-10'].includes(e.date)).length;
assert.equal((html.match(/class="calendar-agenda"/g)||[]).length,2);assert.ok(html.includes('Training Hari Ini')&&html.includes('Training Besok'));
assert.ok(!html.includes('calendar-upcoming')&&!html.includes('Training Mendatang')&&!html.includes('calendar-grid'));
assert.equal(Number(html.match(/class="calendar-month-summary"><strong>(\d+)/)[1]),expected);
assert.ok(html.includes('Senin, 9 November 2026')&&html.includes('Selasa, 10 November 2026'));
const calendar=render('calendar');assert.ok(calendar.includes('calendar-grid')&&calendar.includes('30 November 2026'));
const empty=render('training',{...report.calendar,events:report.calendar.events.filter(e=>e.date>'2026-11-10')});assert.equal((empty.match(/Tidak ada jadwal pada tanggal ini/g)||[]).length,2);assert.ok(empty.includes('<strong>0</strong>'));
console.log('PASS training only today/tomorrow: exactly two agendas, matching total, later schedules excluded, empty state, calendar month preserved.');
