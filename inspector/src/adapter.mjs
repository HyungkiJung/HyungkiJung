import {parseTable} from './schema.mjs';
export const TYPES=['roster','dynamics','employment','capacity','orders'];
export function readWorkbook(XLSX,bytes){
 const w=XLSX.read(bytes,{type:'array',cellFormula:false,cellHTML:false,cellStyles:false,cellNF:true,bookVBA:false});
 return {sheets:w.SheetNames.map(name=>({name,table:XLSX.utils.sheet_to_json(w.Sheets[name],{header:1,raw:true,defval:null,blankrows:true})}))};
}
export function parseWorkbook(XLSX,bytes,type,{file='input',sheet,headerRow}={}){
 const w=readWorkbook(XLSX,bytes);const eligible=w.sheets.map(s=>({name:s.name,parsed:parseTable(type,s.table,{sheet:s.name,file,headerRow})}));
 if(sheet){const s=eligible.find(s=>s.name===sheet);if(!s)throw Error('SHEET_NOT_FOUND');return {...s.parsed,sheets:w.sheets.map(s=>s.name)};}
 const candidates=eligible.filter(s=>!s.parsed.diagnostics.some(d=>['MISSING_KEY_HEADER','INVALID_HEADER_SELECTION'].includes(d.code)));
 if(candidates.length!==1)return {type,blocked:true,rows:[],fields:[],sheets:w.sheets.map(s=>s.name),diagnostics:[{code:candidates.length?'SHEET_SELECTION_REQUIRED':'NO_MATCHING_SHEET',file}]};
 return {...candidates[0].parsed,sheets:w.sheets.map(s=>s.name),selectedSheet:candidates[0].name};
}
export function validateReference(obj){
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('REFERENCE_OBJECT_REQUIRED');
 const catalog=obj.catalog??{},scope=obj.scope??{};
 for(const [id,c]of Object.entries(catalog)){
  if(!id||c.verificationState!=='VERIFIED'||!c.expectedUnit||!c.sourcePage||!['SURVEY','PEAK'].includes(c.capacityMethod)||typeof c.isRegional!=='boolean')throw Error('INVALID_CATALOG_ENTRY');
 }
 for(const s of Object.values(scope))if(!s||!Array.isArray(s.forms)||s.forms.some(x=>!['dynamics','orders'].includes(x)))throw Error('INVALID_SCOPE_ENTRY');
 return {catalog,scope};
}
export const memoKey=r=>JSON.stringify([r.runId,r.ruleId,r.period,r.businessId,r.itemId,r.dimension]);
export function csvCell(v){const s=String(v??'');const safe=/^[\s]*[=+\-@]/.test(s)?"'"+s:s;return '"'+safe.replaceAll('"','""')+'"';}
export function toCsv(rows){return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function detectDataset(XLSX,bytes,{file='input'}={}){
 const w=readWorkbook(XLSX,bytes),candidates=[];
 const identifying={roster:['일련번호'],employment:['조사년월','사업체코드','월말종사자수'],dynamics:['조사년월','사업체코드','품목코드','자체생산(금액)'],capacity:['조사년월','사업체코드','품목코드','생산능력(금액)'],orders:['조사년월','사업체코드','품목코드','전월수주잔량(내수)']};
 const norm=v=>String(v??'').replace(/[\s\u3000]/g,'').toLowerCase().replace('조사연월','조사년월');
 for(const s of w.sheets)for(let n=0;n<Math.min(s.table.length,10);n++){const h=new Set(s.table[n].map(norm));for(const [type,required]of Object.entries(identifying))if(required.every(v=>h.has(norm(v))))candidates.push({type,sheet:s.name,headerRow:n});}
 if(candidates.length!==1)return {unassigned:true,file,candidates,reason:candidates.length?'MULTIPLE_DATASET_CANDIDATES':'DATASET_NOT_IDENTIFIED'};
 const c=candidates[0],s=w.sheets.find(s=>s.name===c.sheet);return {type:c.type,parsed:{...parseTable(c.type,s.table,{file,sheet:c.sheet,headerRow:c.headerRow}),sheets:w.sheets.map(x=>x.name),selectedSheet:c.sheet}};
}
