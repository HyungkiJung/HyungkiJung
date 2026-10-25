// Runtime workbook export. No source workbook or pivot cache is copied.
export function resultWorkbookBytes(XLSX,{result,memos={},mode='actual'}={}){
 const labels={PASS:'정상',REVIEW:'확인 필요',CORRECT:'입력 보완',UNCOMPUTABLE:'계산 불가',EXCLUDED:'검사 제외',NOT_RUN:'미실시'};
 const wb=XLSX.utils.book_new();
 const append=(name,rows,widths)=>{const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=(widths??rows[0].map(()=>18)).map(wch=>({wch}));ws['!autofilter']={ref:ws['!ref']};XLSX.utils.book_append_sheet(wb,ws,name);};
 const display=v=>v&&typeof v==='object'&&'display'in v?v.display:v===null||v===undefined?'':typeof v==='object'?JSON.stringify(v):v;
 const number=v=>{const text=display(v);return typeof text==='number'?text:typeof text==='string'&&/^[+-]?\d+(\.\d+)?$/.test(text)&&Number.isFinite(+text)?+text:null;};
 append('실행정보',[['항목','내용'],['프로그램버전',result.version],['실행번호',result.runId],['자료구분',mode==='demo'?'가상자료':'실제자료'],['기준월',result.period],['명부 연결 조사월(작업 설정)',result.rosterPeriod??''],['명부 원본 월정보','명부에는 월열이 없어 현재 검사월에 연결함'],['검토주의','확인필요는 오류 확정이 아닙니다. 계산불가·미실시와 기준정보 등록 여부를 함께 확인하세요.'],...Object.entries(result.settings).map(([k,v])=>['기준 '+k,String(v)])],[25,95]);
 const scope=[['규칙','상태','조사월','차원','사유코드','근거']];
 for(const r of result.results)if(r.status==='NOT_RUN'||r.status==='EXCLUDED')scope.push([r.ruleId,labels[r.status],r.period,r.dimension,r.reasonCode,r.condition?.source??'']);
 append('검사범위',scope,[12,18,12,35,50,35]);
 const columns=['상태','규칙','조사월','사업체번호','사업체명','품목코드','품목명','부서','담당자','지표','확인사항','현재값','비교값','증감률(%)','차이','잔차','비율(%)','수치근거','출처','확인결과'];
 const selected=result.results.filter(r=>['REVIEW','CORRECT','UNCOMPUTABLE'].includes(r.status));
 const line=r=>[labels[r.status],r.ruleId,r.period,r.businessId??'',r.businessName??'',r.itemId??'',r.itemName??'',r.officeCode??'',r.ownerName??'',r.dimension,r.message??r.reasonCode,number(r.observed?.current),number(r.observed?.previous),number(r.observed?.rate),number(r.observed?.delta),number(r.observed?.residual),number(r.observed?.ratio),JSON.stringify(r.observed??{}),r.condition?.source??'',memos[JSON.stringify([r.runId,r.ruleId,r.period,r.businessId,r.itemId,r.dimension])]??''];
 append('검토목록',[columns,...selected.map(line)],[16,10,12,16,25,15,24,12,14,30,50,14,14,14,14,14,14,60,28,45]);
 for(const id of [...new Set(selected.map(r=>r.ruleId))].sort())append(id,[columns,...selected.filter(r=>r.ruleId===id).map(line)],[16,10,12,16,25,15,24,12,14,30,50,14,14,14,14,14,14,60,28,45]);
 append('입력진단',[['진단코드','자료','조사월','사업체번호','품목코드','내용'],...(result.diagnostics??[]).map(d=>[d.code,d.dataset??'',d.period??'',d.businessId??'',d.itemId??'',JSON.stringify(d)])],[35,18,12,18,18,90]);
 return XLSX.write(wb,{type:'array',bookType:'xlsx',compression:true});
}
