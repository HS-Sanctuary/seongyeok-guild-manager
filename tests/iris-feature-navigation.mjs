// Shared browser interaction for existing IRIS feature regressions.
export async function irisFeatureButton(page,name){
  return page.getByRole('navigation',{name:'크로노스 기능',exact:true}).getByRole('button',{name,exact:true});
}
export async function chooseIrisFeature(page,name){await (await irisFeatureButton(page,name)).click();}
