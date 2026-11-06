/* Render the guide's Markdown as semantic tables, with one shared column grid per table. */
const guideTableStyle=document.createElement('link');guideTableStyle.rel='stylesheet';guideTableStyle.href='style-guidebook-tables.css';document.head.append(guideTableStyle);
function guideCells(row){
  const body=row.trim().replace(/^\|/,'').replace(/\|$/,'');let cells=[],part='',ticks=0;
  for(let i=0;i<body.length;i++){
    const char=body[i];
    if(char==='`'){ticks=ticks?0:1;part+=char;continue}
    if(char==='\\'&&body[i+1]==='|'){part+='|';i++;continue}
    if(char==='|'&&!ticks){cells.push(part.trim());part='';continue}
    part+=char;
  }
  cells.push(part.trim());return cells;
}
function guideTable(block,base){
  const rows=block.map(guideCells).filter(cells=>!cells.every(cell=>/^:?-{2,}:?$/.test(cell)));
  if(!rows.length)return '';
  const columns=rows[0].length;
  const cell=(tag,value)=>`<${tag}${tag==='th'?' scope="col"':''}>${inline(value,base)}</${tag}>`;
  const head=`<thead><tr>${rows[0].map(value=>cell('th',value)).join('')}</tr></thead>`;
  const body=rows.slice(1).map(row=>{
    const filled=Array.from({length:columns},(_,i)=>row[i]??'');
    if(row.length>columns)filled[columns-1]+=' · '+row.slice(columns).join(' · ');
    return `<tr>${filled.map(value=>cell('td',value)).join('')}</tr>`;
  }).join('');
  return `<div class="table-scroll" role="region" aria-label="가이드 상세 표" tabindex="0"><table style="min-width:${Math.max(560,columns*190)}px">${head}<tbody>${body}</tbody></table></div>`;
}
markdown=function(raw,base){
  const out=[],lines=raw.split('\n');let i=0;
  while(i<lines.length){
    const line=lines[i];if(!line.trim()){i++;continue}
    if(line.trimStart().startsWith('|')){const block=[];while(i<lines.length&&lines[i].trimStart().startsWith('|'))block.push(lines[i++]);out.push(guideTable(block,base));continue}
    if(/^[-*] /.test(line)){const items=[];while(i<lines.length&&/^[-*] /.test(lines[i]))items.push(`<li>${inline(lines[i++].slice(2),base)}</li>`);out.push(`<ul>${items.join('')}</ul>`);continue}
    if(/^\d+\. /.test(line)){const items=[];while(i<lines.length&&/^\d+\. /.test(lines[i]))items.push(`<li>${inline(lines[i++].replace(/^\d+\. /,''),base)}</li>`);out.push(`<ol>${items.join('')}</ol>`);continue}
    if(/^#{3,6} /.test(line)){const depth=line.match(/^#+/)[0].length;out.push(`<h${depth}>${inline(line.slice(depth+1),base)}</h${depth}>`);i++;continue}
    if(line.startsWith('```')){const code=[];i++;while(i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i++]);i++;out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);continue}
    const para=[];while(i<lines.length&&lines[i].trim()&&!lines[i].trimStart().startsWith('|')&&!/^[-*] |^\d+\. |^#{3,6} |^```/.test(lines[i]))para.push(lines[i++]);out.push(`<p>${para.map(x=>inline(x,base)).join('<br>')}</p>`);
  }
  return out.join('');
};
render();
