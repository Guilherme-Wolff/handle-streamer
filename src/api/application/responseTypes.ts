export interface isOnline {
	OriginalUrl?:string;
	resolutions?:Array<string> | string;
	status:boolean;
	schedule_live?:true;
}

export interface IResoluctions {
	resolutionsOptions:string[];
}