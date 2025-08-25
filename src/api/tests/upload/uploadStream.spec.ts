import { uploadService, INFOuploadService } from "../../application/services/upload.service"
import { PATH_STREAMS_OUTPUT_TESTS } from "../../../../root_path"

const txtfile = 'testfile.txt'

const BUNKER_TOKEN = '7BQHDIcDS5K1RpVD3p7sgwZNOd0It9lkc9IpiVOOAan0UCa6P0fiFxIU9BUWB14J';

const uploaderConfig: INFOuploadService = {
    token: BUNKER_TOKEN,
    api_url: 'https://n14.bunkr.ru/api/upload',
    absolute_path_streams: PATH_STREAMS_OUTPUT_TESTS
}


describe('UPLOAD TEST', () => {
    let uploader: uploadService;

    beforeEach(() => {
        uploader = new uploadService(uploaderConfig)
    });

    test('UPLOAD TXT FILE', async () => {
        //jest.useFakeTimers();

        //const uploadStreamSpy = jest.spyOn(uploader, 'uploadStream');

        const res = await uploader.uploadStream(txtfile);
        console.log("TESTE RESPOSTA", res)

        //expect(uploadStreamSpy).toHaveBeenCalled();

        expect(res).toBeDefined()
        expect(res.success).toBe(true);

        //jest.runAllTimers();
        //await expect(Promise.resolve(res.success)).resolves.toBe(true);
    })

    /*test('UPLOAD STREAM', async () => {


        await expect(size).toBe(NUMBER_OF_PROCESS);
    }) */

});