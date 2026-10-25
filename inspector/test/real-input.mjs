// Read-only integration check. The report contains aggregate counts only.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {parseWorkbook} from '../src/adapter.mjs';
import {runInspection} from '../src/engine.mjs';
const require=createRequire(import.meta.url),X=require('../vendor/xlsx.full.min.cjs');
const names={roster:'광업제조업동향조사_사업체명부관리(대면)_.xlsx',dynamics:'동태.xlsx',employment:'고용.xlsx',capacity:'능력.xlsx',orders:'동태2.xlsx'};
const datasets={},counts={};
for(const [type,name]of Object.entries(names)){const p=parseWorkbook(X,fs.readFileSync(new URL('../../../../upload/'+name,import.meta.url)),type,{file:name});datasets[type]=p;counts[type]={blocked:p.blocked,rows:p.rows.length,periods:[...new Set(p.rows.map(r=>r.period).filter(Boolean))].sort(),diagnostics:Object.fromEntries([...new Set(p.diagnostics.map(d=>d.code))].map(c=>[c,p.diagnostics.filter(d=>d.code===c).length]))};}
const start=performance.now();const out=runInspection({datasets,period:'202609',runId:'actual-integration',catalog:{},scope:{}});const elapsed=Math.round(performance.now()-start);
console.log(JSON.stringify({version:out.version,notice:'실제 입력 연결의 기술 검증. 모든 경고의 업무상 정오를 검증한 결과가 아님. 품목사전·대상표 미제공.',counts,elapsedMs:elapsed,summary:out.summary,ruleCoverage:new Set(out.results.map(r=>r.ruleId)).size},null,2));
