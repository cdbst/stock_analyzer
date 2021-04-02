
const {google} = require('googleapis');

function search_file(auth, file_name, __callback){

    const drive = google.drive({version: 'v3', auth});

    drive.files.list({
        q: "name='" + file_name + "'",
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    },(err, res) => {

        if (err){
            console.log(err);
            __callback(err);
            return;
        }

        const files = res.data.files;

        if (files.length) {
            console.log('Files:');
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
            });
            __callback(undefined, files[0]);
            return;
        }else{
            console.log('No files found.');
            __callback('No files found.');
            return;
        }
    });
}

function copy_file(auth, file_obj, __callback){

    const drive = google.drive({version: 'v3', auth});

    drive.files.copy({
        fileId: file_obj.id
    },(err, res) => {

        if (err){
            console.log(err);
            __callback(err);
            return;
        }

        __callback(undefined, res.data);
    });
}

function rename_file(auth, file_obj, __callback){


}

function move_file(auth, file_obj, folder_obj, __callback){

}

module.exports.search_file = search_file;
module.exports.copy_file = copy_file;

module.exports.rename_file = rename_file;
module.exports.move_file = move_file;
