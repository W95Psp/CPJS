let fs = require('fs');

let DataTypes = {
	EXPR : 0x01,	INT : 0x02,		EXPR : 0x03,	FLT : 0x04,		STR : 0x05,		EXPR : 0x06,
	FILE : 0x09,	LIST : 0x0A,	VECT : 0x0B,	MAT : 0x0C,		EXPR : 0x12,
	TEXT : 0x47,	EXE : 0x47,		PRGM : 0x47,	FUNC : 0x48,	PICT : 0x4D,	MEM : 0x4e,
	EXEC : 0x4F,	GMEM : 0x50,	G3D : 0x51,		CONT : 0x53,	GEO : 0x54,		REG : 0x55
}
let doesDataTypeExists = v => Object.keys(DataTypes).includes(o => DataTypes[o]==v);

let dbg = o => console.log(o);

let M = num => ({bigEndian: true, num})
let I = num => ({bigEndian: false, num})

function MscFile(filename){
	this.filename = filename;
	this.loadData();

	// this.folders = [{name: 'main', files: []}];
	this.folders = [{name: 'main', files: [
		{
			name: 'File1',
			type: DataTypes.PRGM,
			content: 'Fi1Co1',
			locked: false
		},
		// {
		// 	name: 'File2',
		// 	type: DataTypes.PRGM,
		// 	content: 'Fi2Co1',
		// 	locked: false
		// },
		// {
		// 	name: 'File3',
		// 	type: DataTypes.PRGM,
		// 	content: 'Fi3Co1',
		// 	locked: false
		// }
	]}];

	this.offsetInClassPad = 0x00C94020;
	this.info = {};
	this.writerData = {
		offset: this.offsetInClassPad,
		rawData: [],
		getBufferList: () => {
			let raw = this.writerData.rawData;
			for(let i = raw.length - 1; i>=0; i--)
				if(typeof raw[i][1] == 'function'){
					let v = raw[i][1]();
					if(v == undefined){
						dbg(raw[i].toString() + typeof M(23));
						throw "sdsd";
					}
						// dbg(raw[i].toString());
					raw[i][1] = v;
				}
			return raw.map(o => {
				let length = o[0];
				let content = o[1];
				let bytes = Buffer.alloc(length);

				if(typeof content == 'string')
					bytes.write(content);
				else if(typeof content == 'object'){
					let mode = content.bigEndian ? 'B' : 'L';
					if(length==1)
						bytes.writeUInt8(content.num);
					else{
						bytes['writeUInt'+(length*8)+mode+'E'](content.num);
					}
				}else{
					throw JSON.stringify(content);
				}

				if(bytes.length > length)
					throw {msg: 'Too long', bytes, content, length};

				let conc = [Buffer.alloc(length - bytes.length), bytes];
				
				if(typeof content == 'string')
					conc.reverse();

				return Buffer.concat(conc);
			});
		}
	};
	this.writeSome = (list, justAdd) => {
		list.forEach(o => this.writerData.rawData.push(o));
		if(justAdd===true)
			return {};
		let size = list.map(o => o[0]).reduce((a, b) => a+b, 0);
		console.log(this.writerData.offset);
		return {
			offsetStart: this.writerData.offset,
			offsetEnd: this.writerData.offset += size,
			size: size
		}
	}
}
MscFile.prototype.loadData = function() {
	// this.filename;
};

MscFile.prototype.writeFileHeader = function() {
	this.writeSome([
		[15, 'CP MCSIMAGEFILE'],
		[1, M(0)],
		[4, M(0x00000002)],
		[4, M(this.offsetInClassPad)]
	], true);
};
MscFile.prototype.writeMemImage = function() {
	this.writeMemImageHeader();
	this.writeMemImageFolderList();
	this.folders.forEach(folder => {
		this.writeMemImageFileList(folder);
		this.writeDataFolder(folder);
	});
};
MscFile.prototype.writeMemImageHeader = function() {
	this.writeSome([
		[4, () => I(this.writerData.offset)],		//dataEndOffset
		[4, () => I(this.offsetStartFolderList)],	//MainFolderOffset
		[4, I(0x080000 + this.offsetInClassPad + 0x18)],		//ImageEndOffset1
		[4, I(0x080000 + this.offsetInClassPad + 0x18)],		//ImageEndOffset2
		[4, M(0x00000000)],
		[4, M(0x00000000)],
		[4, I(0xFFFFFFFF)],[4, I(0xFFFFFFFF)],[4, I(0xFFFFFFFF)],[4, I(0xFFFFFFFF)],
		[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],
		[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],
		[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],
		[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],
		[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)],
		[4,I(0)],[4,I(0)],[4,I(0)],[4,I(0)]
	]);
};
MscFile.prototype.writeMemImageFolderList = function() {
	for(let i = this.folders.length; i<=134; i++){
		let info = this.writeSome([
			[8, ''],
			[4, () => I(this.folders[0].offsetFileListStart)],
			[2, M(0)],
			[1, M(0)],	//locked byte
			[1, M(0)]
		]);
	}

	this.folders.forEach(folder => {
		let info = this.writeSome([
			[8, folder.name],
			[4, () => I(folder.offsetFileListStart)],
			[2, M(folder.files.length)],
			[1, M(0)],	//locked byte
			[1, M(0)]
		]);
		if(!this.offsetStartFolderList){
			this.offsetStartFolderList = this.offsetStartFolderList || (info.offsetStart);
			console.log('we put = ', info.offsetStart)
		}
	});
};
MscFile.prototype.writeMemImageFileList = function(folder) {
	folder.files.forEach((file, n) => {
		// if(!doesDataTypeExists(file.type))
		// 	throw JSON.stringify(file, null, 4);
		let info;
		info = this.writeSome([
			[8, file.name],
			[4, () => {
				// if(n==0)
				// 	folder.offsetFileListStart = file.offsetStart;
				return M (file.offsetFromBeginingOfFileList)
			}],
			[4, () => M(file.size), file.name],
			[1, M(file.type)],  // datatype
			[1, M(+!!file.locked)],	//locked byte
			[2, M(0x86)],
		]);
		if(n==0)
			folder.offsetFileListStart = info.offsetStart;
	});
	
};
MscFile.prototype.writeDataFolder = function(folder) {
	folder.files.forEach(file => this.writeOneProgram(file, folder));
};
MscFile.prototype.writeOneProgram = function(file, folder) {
	let programPlaintext = file.content;
	let info = this.writeSome([
		[4, M(programPlaintext.length)],
		[4, M(0)],	//CompressedSize
		[4, M(1)],	//Modifier
		[programPlaintext.length + (4 - (programPlaintext.length % 4)), programPlaintext]
	]);
	file.size = info.size;
	console.log('File ', file.name, ' // size = ', file.size)
	file.offsetStart = info.offsetStart;
	file.offsetFromBeginingOfFileList = info.offsetStart - folder.offsetFileListStart;
};

MscFile.prototype.writeData = function() {
	let file = [];

	this.writeFileHeader();
	this.writeMemImage();

	let data = Buffer.concat(this.writerData.getBufferList());

	let filledData = Buffer.concat([data, Buffer.alloc(0x18 + 0x080000 - data.length)])
	let stream = fs.createWriteStream(this.filename);
	stream.write(filledData);
};

let f = new MscFile('test.mcs');
f.writeData();