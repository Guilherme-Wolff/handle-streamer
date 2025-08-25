import fs from "fs"
import * as path from 'path';
import { dirname } from 'path';

export const renameLiveFile = (name:string) => {
    
    const lives_path = `${process.cwd()}/src/api/infrastructure/lives_saved`;
    console.log("NEW pwd : ",lives_path)
    
    const current_name = `${name}.mp4.part`;

    const newName = `${name}.mp4`;//name.replace('.part', '');

    console.log("NEW NAME : ",newName)

    const current_path = path.join(lives_path, current_name);
    const newPathFile = path.join(lives_path, newName);

    console.log("PASTA TESTE : ",current_path)
    console.log("pasta atual : ",lives_path)
    console.log("new sta atual : ",newPathFile)

    fs.rename(current_path, newPathFile, (err) => {
        if (err) {
            console.error('error rename file', err);
        } else {
            console.log('.part remove!');
        }
        
    });
}
