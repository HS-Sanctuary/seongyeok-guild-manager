import Image from 'next/image';
const icons:Record<string,string>={'목재':'wood','가죽':'leather','금속':'metal','옷감':'cloth','약품':'alchemy','식재료':'food','음식':'food','요리':'food'};
export function ErgonFacilityIcon({name}:{name:string}){
 const key=Object.keys(icons).find(key=>name.includes(key));
 return key?<Image className="iris-ergon-facility-icon" src={`/IRIS/facilities/facility-${icons[key]}.png`} width={40} height={40} sizes="40px" alt="" aria-hidden="true"/>:null;
}
