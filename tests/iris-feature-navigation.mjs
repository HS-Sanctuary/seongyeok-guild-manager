// Shared browser interaction for existing IRIS feature regressions.
export async function irisFeatureButton(page,name){
  const trigger=page.getByRole('button',{name:'기능 선택',exact:true});
  if(await trigger.getAttribute('aria-expanded')!=='true')await trigger.click();
  return page.getByRole('region',{name:'크로노스 기능 선택',exact:true}).getByRole('button',{name,exact:true});
}
export async function chooseIrisFeature(page,name){await (await irisFeatureButton(page,name)).click();}
