// ==UserScript==
// @name        Search By Image
// @version     1.4.5
// @description Search By Image | 以图搜图
// @match       <all_urls>
// @include     *
// @author      864907600cc
// @icon        http://1.gravatar.com/avatar/147834caf9ccb0a66b2505c753747867
// @run-at      document-start
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @namespace   http://ext.ccloli.com
// ==/UserScript==

// 本脚本基于 GPLv3 协议开源 http://www.gnu.org/licenses/gpl.html‎
// (c) 86497600cc. Some Rights Reserved.
// Default setting: Press Ctrl and click right key on a image to search.

'use strict';
var default_setting={
	"site_list":{
		"Google":"https://www.google.com/searchbyimage?image_url={%s}",
		"Baidu ShiTu":"http://stu.baidu.com/i?ct=1&tn=baiduimage&objurl={%s}",
		"Baidu Image":"http://image.baidu.com/i?rainbow=1&ct=1&tn=shituresultpc&objurl={%s}",
		"Bing":"http://cn.bing.com/images/searchbyimage?FORM=IRSBIQ&cbir=sbi&imgurl={%s}",
		"TinEye":"http://www.tineye.com/search?url={%s}",
		//"Cydral":"http://www.cydral.com/#url={%s}",
		"Yandex":"http://yandex.ru/images/search?rpt=imageview&img_url={%s}",
		"Sogou":"http://pic.sogou.com/ris?query={%s}",
		"360 ShiTu":"http://st.so.com/stu?imgurl={%s}",
		"SauceNAO":"http://saucenao.com/search.php?db=999&url={%s}",
		"IQDB":"http://iqdb.org/?url={%s}",
		"3D IQDB":"http://3d.iqdb.org/?url={%s}"
	},
	"site_option":["Google","Baidu ShiTu","Baidu Image","Bing","TinEye","Яндекс (Yandex)","Sogou","360 ShiTu","SauceNAO","IQDB","3D IQDB"],
	"hot_key":"ctrlKey"
};

var server_url="//sbi.ccloli.com/img/upload.php";
// 在此处直接输入完整的上传页面的地址（Firefox 请尽量选择支持 https 的服务器）
// 地址前使用"//"表示按照当前页面设定决定是否使用 https
// 地址前使用"http://"表示强制使用 http
// 地址前使用"https://"表示强制使用 https（需确认服务器支持 ssl）
// 如果需要自己架设上传服务器的话请访问 GitHub 项目页（https://github.com/ccloli/Search-By-Image）获取服务端
// 其他可用的上传服务器如下：
// Heroku: //search-by-image.herokuapp.com/img/upload.php （支持 https）
// BeGet: http://fh13121a.bget.ru/img/upload.php （不支持 https）
// OpenShift: //searchbyimage-864907600cc.rhcloud.com/img/upload.php （支持 https）
// DigitalOcean VPS: //sbi.ccloli.com/img/upload.php （支持 https，thanks to Retaker）
// 注意，部分服务器可能仅支持 http 协议，若您选择了这些服务器，请务必注明 "http://"，且若您使用的是 Firefox 浏览器，在 https 页面下将不能上传文件搜索搜索（除非设置 security.mixed_content.block_active_content 为 false）

var search_panel=null;
var setting=GM_getValue('setting')?JSON.parse(GM_getValue('setting')):default_setting;
var disable_contextmenu=false;
var img_src=null;
var data_version=GM_getValue('version',0);
var last_update=GM_getValue('timestamp',0);
var xhr=new XMLHttpRequest();
var reader=new FileReader();
reader.onload=function(file){upload_file(this.result);};

function set_setting(data){
	GM_setValue('setting',JSON.stringify(data));
	GM_setValue('timestamp',new Date().getTime());
}

function create_panel(){
	search_panel=document.createElement('div');
	search_panel.style.cssText='width:198px;font-size:14px;text-align:center;position:absolute;color:#000;z-index:9999999999;box-shadow:2px 2px 3px rgba(0,0,0,0.5);border:1px solid #CCC;background:rgba(255,255,255,0.9);border-top-right-radius:2px;border-bottom-left-radius:2px;font-family:"Arial";-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none';
	document.body.appendChild(search_panel);
	var search_top=document.createElement('div');
	search_top.style.cssText='width:90%;height:24px;line-height:24px;font-size:12px;overflow:hidden;margin:0 auto';
	search_top.className='image-search-top';
	search_top.innerHTML='<div class="search_top_url" style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;width:100%;height:24px"></div><div class="search_top_file" style="width:100%;height:24px;line-height:24px" draggable="true"><label for="image-search-file">上传图片并搜索</label><input type="file" id="image-search-file" accept="image/*" style="width:0px;height:0px;max-height:0px;max-width:0px;margin:0;padding:0"></div><div class="search_top_progress"><progress style="width:100%;height:16px;vertical-align:middle;margin:4px 0" max="1"></progerss></div><style>.image-search-item{color:#000000;transition:all 0.2s linear;-webkit-transition:all 0.2s linear}.image-search-item::hover{color:#5B97FF;background:#EEEEEE}';
	search_panel.appendChild(search_top);
	var search_item=document.createElement('div');
	search_item.style.cssText='width:100%;height:24px;line-height:24px;cursor:pointer';
	search_item.className='image-search-item';
	for(var i in setting.site_list){
		var search_item_child=search_item.cloneNode(true);
		search_item_child.textContent=i;
		search_item_child.setAttribute('search-option',i);
		search_panel.appendChild(search_item_child);
	}
	search_item.textContent='All';
	search_item.setAttribute('search-option','all');
	search_panel.appendChild(search_item);
	var search_item_setting=search_item.cloneNode(true);
	search_item_setting.textContent='Setting';
	search_item_setting.setAttribute('search-option','setting');
	search_panel.appendChild(search_item_setting);
	search_top.getElementsByTagName('input')[0].onchange=function(){reader.readAsDataURL(this.files[0]);};
	search_panel.ondragenter=function(event){
		event.preventDefault();
		search_top.getElementsByTagName('label')[0].textContent='11111';
	};
	search_panel.ondragleave=function(event){
		event.preventDefault();
		search_top.getElementsByTagName('label')[0].textContent='22222';
	};
	search_panel.ondragover=function(event){
		search_top.getElementsByTagName('label')[0].textContent='33333';
		event.preventDefault();
	};
	search_panel.ondrop=function(event){
		event.stopPropagation();
		event.preventDefault();
		var files=event.target.files||event.dataTransfer.files;
		if(files[files.length-1].type.indexOf('image')>=0)reader.readAsDataURL(files[files.length-1]);
	};
	search_top.getElementsByTagName('progress')[0].onclick=function(){
		if(xhr.readyState!=0&&confirm('4444444？')==true){
			xhr.abort();
			search_panel.getElementsByClassName('search_top_url')[0].style.marginTop='-24px';
		}
	};
	if(navigator.userAgent.indexOf('Firefox')>=0){
		var paste_node_firefox=document.createElement('div');
		paste_node_firefox.setAttribute('contenteditable','true');
		paste_node_firefox.className='image-search-paste-node-firefox';
		paste_node_firefox.style.cssText='width:0!important;height:0!important;position:absolute;overflow:hidden';
		paste_node_firefox.addEventListener('paste',function(event){
			setTimeout(function(){
				var _images=paste_node_firefox.getElementsByTagName('img');
				if(_images.length>0){
					var _img_src=_images[_images.length-1].src;
					if(_img_src.match(/^data:.*?;base64,/))upload_file(_img_src);
				}
			},500);
		},false);
		search_top.appendChild(paste_node_firefox);
	}
}

function call_setting(){
	var setting_panel=document.createElement('div');
	setting_panel.style.cssText='width:520px;font-size:14px;position:fixed;color:#000;z-index:9999999999;box-shadow:2px 2px 3px rgba(0,0,0,0.5);border:1px solid #CCC;background:rgba(255,255,255,0.9);border-top-right-radius:2px;border-bottom-left-radius:2px;padding:10px;left:0;right:0;top:0;bottom:0;margin:auto;font-family:"Arial";height:400px;max-height:90%;overflow:auto;text-align:center;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none';
	document.body.appendChild(setting_panel);
	var setting_header=document.createElement('div');
	setting_header.style.cssText='width:100%;height:32px;line-height:32px;font-size:18px;line-height:32px';
	setting_header.className='image-search-setting-header';
	setting_header.textContent='Search By Image Setting';
	setting_panel.appendChild(setting_header);
	var setting_item=document.createElement('div');
	setting_item.style.cssText='width:100%;height:24px;line-height:24px;margin:1px 0';
	setting_item.className='image-search-setting-title';
	setting_item.innerHTML='<div style="text-align:center;display:inline-block;width:30px">55</div><div style="width:100px;text-align:center;display:inline-block">66</div><div style="width:350px;text-align:center;display:inline-block">7777 {%s} 88）</div><div style="width:20px;display:inline-block"></div>';
	setting_panel.appendChild(setting_item);
	for(var i in setting.site_list){
		var setting_item_child=setting_item.cloneNode(true);
		setting_item_child.className='image-search-setting-item';
		setting_item_child.innerHTML='<div style="text-align:center;display:inline-block;width:30px;vertical-align:middle"><input type="checkbox"'+(setting.site_option.join('\n').indexOf(i)>=0?' checked="checked"':'')+'></div><div style="width:100px;text-align:center;display:inline-block"><input style="width:90px" type="text" value="'+i+'"></div><div style="width:350px;text-align:center;display:inline-block"><input style="width:340px" type="text" value="'+setting.site_list[i]+'"></div><div style="text-align:center;display:inline-block;cursor:pointer;width:20px">×</div>';
		setting_panel.appendChild(setting_item_child);
		setting_item_child.getElementsByTagName('div')[3].onclick=function(){this.parentElement.outerHTML='';};
	}
	var setting_footer=document.createElement('div');
	setting_footer.style.cssText='width:100%;height:32px;line-height:32px;margin-top:5px;text-align:right';
	setting_footer.className='image-search-setting-footer';
	setting_panel.appendChild(setting_footer);
	var setting_hotkey=document.createElement('div');
	var setting_add=document.createElement('div');
	var setting_reset=document.createElement('div');
	var setting_save=document.createElement('div');
	var setting_cancel=document.createElement('div');
	setting_hotkey.style.cssText='height:32px;display:inline-block;text-align:left;float:left';
	setting_add.style.cssText='width:90px;height:32px;margin:0 5px;background:#666;color:#FFF;display:inline-block;text-align:center;cursor:pointer';
	setting_reset.style.cssText='width:90px;height:32px;background:#666;color:#FFF;display:inline-block;text-align:center;cursor:pointer';
	setting_save.style.cssText='width:90px;height:32px;margin:0 5px;background:#666;color:#FFF;display:inline-block;text-align:center;cursor:pointer';
	setting_cancel.style.cssText='width:90px;height:32px;background:#666;color:#FFF;display:inline-block;text-align:center;cursor:pointer';
	setting_add.textContent='Add Item';
	setting_reset.textContent='Reset';
	setting_save.textContent='Save';
	setting_cancel.textContent='Cancel';
	setting_hotkey.innerHTML='Hot Key <select><option value="ctrlKey"'+(setting.hot_key=='ctrlKey'?' selected':'')+'>Ctrl</option><option value="shiftKey"'+(setting.hot_key=='shiftKey'?' selected':'')+'>Shift</option><option value="altKey"'+(setting.hot_key=='altKey'?' selected':'')+'>Alt</option></select>';
	setting_footer.appendChild(setting_hotkey);
	setting_footer.appendChild(setting_add);
	setting_footer.appendChild(setting_reset);
	setting_footer.appendChild(setting_save);
	setting_footer.appendChild(setting_cancel);
	setting_add.onclick=function(){
		var setting_item_child=setting_item.cloneNode(true);
		setting_item_child.className='image-search-setting-item';
		setting_item_child.innerHTML='<div style="text-align:center;display:inline-block;width:30px;vertical-align:middle"><input type="checkbox"></div><div style="width:100px;text-align:center;display:inline-block"><input style="width:90px" type="text"></div><div style="width:350px;text-align:center;display:inline-block"><input style="width:340px" type="text"></div><div style="text-align:center;display:inline-block;cursor:pointer;width:20px">×</div>';
		setting_panel.insertBefore(setting_item_child,setting_footer);
		setting_item_child.getElementsByTagName('div')[3].onclick=function(){this.parentElement.outerHTML='';};
		setting_panel.scrollTop=setting_panel.scrollHeight;
	};
	setting_reset.onclick=function(){
		if(confirm('确定将所有设置初始化么？\n\n(初始化将清除所有所有设置，且不可逆)')==true){
			setting=default_setting;
			set_setting(setting);
			setting_panel.outerHTML='';
			if(search_panel!=null){
				search_panel.outerHTML='';
				search_panel=null;
			}
			call_setting();
		}
	};
	setting_save.onclick=function(){
		var setting_items=document.getElementsByClassName('image-search-setting-item');
		var setting_data={"site_list":{},"site_option":[],"hot_key":null};
		for(var i=0;i<setting_items.length;i++){
			if(setting_items[i].getElementsByTagName('input')[1].value!=''){
				if(setting_items[i].getElementsByTagName('input')[0].checked)setting_data.site_option.push(setting_items[i].getElementsByTagName('input')[1].value);
				setting_data.site_list[setting_items[i].getElementsByTagName('input')[1].value]=setting_items[i].getElementsByTagName('input')[2].value;
			}
		}
		setting_data.hot_key=setting_hotkey.getElementsByTagName('select')[0].value;
		console.log(setting_data);
		setting=setting_data;
		set_setting(setting);
		setting_panel.outerHTML='';
		if(search_panel!=null){
			search_panel.outerHTML='';
			search_panel=null;
		}
	};
	setting_cancel.onclick=function(){setting_panel.outerHTML='';};
}

function upload_file(data){
	if(xhr.readyState!=0)xhr.abort();
	xhr.onreadystatechange=function(){
		if(xhr.readyState==4){
			if(xhr.status==200){
				img_src=xhr.responseText;
				search_panel.getElementsByClassName('search_top_url')[0].style.marginTop='0px';
				search_panel.getElementsByClassName('search_top_url')[0].textContent='9999！';
			}
		}
	};
	xhr.upload.onprogress=function(event){search_panel.getElementsByTagName('progress')[0].value=event.loaded/event.total;};
	xhr.onerror=function(){alert('0000！');};
	var form=new FormData();
	xhr.open('POST',server_url);
	form.append('imgdata',data);
	xhr.send(form);
	search_panel.getElementsByClassName('search_top_url')[0].style.marginTop='-48px';
}

function get_clipboard(event){
	var items=event.clipboardData.items;
	if(items[items.length-1].type.indexOf('image')>=0)reader.readAsDataURL(items[items.length-1].getAsFile());
}

function hide_panel(){
	img_src=null;
	search_panel.style.display='none';
	document.removeEventListener('paste',get_clipboard,false);
}

document.addEventListener('mousedown',function(event){ // In order to fix a bug on Chrome Tampermonkey
//document.onmousedown=function(event){ 
	//console.log('Search Image >>\nevent.ctrlKey: '+event.ctrlKey+'\nevent.button: '+event.button+'\nevent.target.tagName: '+event.target.tagName+'\nevent.target.src: '+event.target.src+'\nevent.pageX: '+event.pageX+'\nevent.pageY: '+event.pageY+'\ndocument.documentElement.clientWidth: '+document.documentElement.clientWidth+'\ndocument.documentElement.clientHeight: '+document.documentElement.clientHeight+'\ndocument.documentElement.scrollWidth: '+document.documentElement.scrollWidth+'\ndocument.documentElement.scrollHeight: '+document.documentElement.scrollHeight+'\ndocument.documentElement.scrollLeft: '+document.documentElement.scrollLeft+'\ndocument.documentElement.scrollTop: '+document.documentElement.scrollTop);
	if(disable_contextmenu==true){
		document.oncontextmenu=null;
		disable_contextmenu=false;
	}
	if(event[setting.hot_key]==true&&event.button==2){
		if(search_panel==null)create_panel();
		else if(last_update!=GM_getValue('timestamp',0)){
			last_update=GM_getValue('timestamp',0)
			search_panel.outerHTML='';
			setting=GM_getValue('setting')?JSON.parse(GM_getValue('setting')):default_setting;
			create_panel();
		}
		else search_panel.style.display='block';
		search_panel.style.left=(document.documentElement.clientWidth+document.body.scrollLeft-event.pageX>=200?event.pageX:event.pageX>=200?event.pageX-200:0)+'px';
		search_panel.style.top=(document.documentElement.scrollHeight-event.pageY>=search_panel.scrollHeight?event.pageY:event.pageY>=search_panel.scrollHeight?event.pageY-search_panel.scrollHeight:0)+'px';
		disable_contextmenu=true;
		//for(var i=0;i<setting.site_option.length;i++)GM_openInTab(setting.site_list[setting.site_option[i]].replace(/\{%s\}/,encodeURIComponent(event.target.src)));
		document.oncontextmenu=function(){return false;};
		if(event.target.tagName.toLowerCase()=='img'&&event.target.src!=null){
			search_panel.getElementsByClassName('search_top_url')[0].style.marginTop='0px';
			search_panel.getElementsByClassName('search_top_url')[0].textContent=event.target.src;
			if(event.target.src.match(/^data:.*?;base64,/)!=null)upload_file(event.target.src);
			else img_src=event.target.src;
		}
		else{
			search_panel.getElementsByClassName('search_top_url')[0].style.marginTop='-24px';
			if(navigator.userAgent.indexOf('Firefox')>=0){
				document.getElementsByClassName('image-search-paste-node-firefox')[0].innerHTML='';
				document.getElementsByClassName('image-search-paste-node-firefox')[0].focus();
			}
			else document.addEventListener('paste',get_clipboard,false);
		}
	}
	else if(search_panel!=null){
		if(event.target.compareDocumentPosition(search_panel)==10||event.target.compareDocumentPosition(search_panel)==0){
			if(event.target.className=='image-search-item'&&event.button==0){
				switch(event.target.getAttribute('search-option')){
					case 'all':
						if(img_src!=null){
							for(var i=setting.site_option.length-1;i>=0;i--)GM_openInTab(setting.site_list[setting.site_option[i]].replace(/\{%s\}/,encodeURIComponent(img_src)));
							hide_panel();
						}
						break;
					case 'setting':
						call_setting();
						hide_panel();
						break;
					default:
						if(img_src!=null){
							GM_openInTab(setting.site_list[event.target.getAttribute('search-option')].replace(/\{%s\}/,encodeURIComponent(img_src)));
							hide_panel();
						}
				}
			}
			else if(event.button!=0)hide_panel();
		}
		else hide_panel();
	}
},false);

var gm_callsetting=GM_registerMenuCommand('Search By Image Setting',call_setting);
