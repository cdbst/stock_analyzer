
const {google} = require('googleapis');

function search_file(auth, file_name, __callback){

    const drive = google.drive({version: 'v3', auth});

    drive.files.list({
        q: "name='" + file_name + "' and trashed = false",
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
            __callback(undefined, files[0]);
            return;
        }else{
            console.log('No files found.');
            __callback('No files found.');
            return;
        }
    });
}

function get_file_list_in_folder(auth, folder_obj, __callback){

    const drive = google.drive({version: 'v3', auth});

    drive.files.list({
        q: "'" + folder_obj.id + "' in parents and trashed = false",
        pageSize: 1000,
        fields: 'nextPageToken, files(id, name)',
    },(err, res) => {

        if (err){
            console.log(err);
            __callback(err);
            return;
        }

        const files = res.data.files;

        if (files.length) {
            __callback(undefined, files);
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

function rename_file(auth, file_obj, new_file_name, __callback){

    const drive = google.drive({version: 'v3', auth});

    drive.files.update({
        fileId: file_obj.id,
        resource: {'name' : new_file_name}
    },(err, res) => {

        if (err){
            console.log(err);
            __callback(err);
            return;
        }

        __callback(undefined, res.data);
    });

}

function delete_file(auth, file_obj, __callback){

    const drive = google.drive({version: 'v3', auth});

    drive.files.delete({
        fileId: file_obj.id,
    },(err, res) => {

        if (err){
            console.log(err);
            __callback(err);
            return;
        }

        __callback(undefined, res.data);
    });
}

function move_file(auth, file_obj, folder_obj, __callback){

    const drive = google.drive({version: 'v3', auth});

    drive.files.get({
        fileId: file_obj.id,
        fields: 'parents'
    },(err, res) => {

        if (err){
            console.log(err);
            __callback(err);
            return;
        }
        
        var previous_parents = res.data.parents.join('.');

        drive.files.update({
            fileId: file_obj.id,
            addParents: folder_obj.id,
            removeParents: previous_parents,
            fields: 'id, parents'
        }, (err, res) => {

            if (err){
                console.log(err);
                __callback(err);
                return;
            }

            __callback(undefined, res.data);
        });
    });
}

module.exports.search_file = search_file;
module.exports.copy_file = copy_file;

module.exports.rename_file = rename_file;
module.exports.move_file = move_file;

module.exports.get_file_list_in_folder = get_file_list_in_folder;
module.exports.delete_file = delete_file;
