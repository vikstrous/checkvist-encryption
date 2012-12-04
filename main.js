var password = localStorage["password"];
var p = {};
p.ks = 256;
p.adata = "autodecrypt";
var rp = {};
var should_encrypt = false;

var strings = {
  no_pass: "Press ctrl + shift + [ to enter a password.",
  pass_entered: "Decrypting..."
}

// sets up the insertion of the status element
function insert_status_ele() {
  var div = document.createElement('div');
  div.id = "checkvist_enc_status";
  document.getElementsByTagName('body')[0].appendChild(div);
  set_status(password?strings.pass_entered:strings.no_pass);
}

// displays a status message for 5 seconds
function set_status(text) {
  document.getElementById('checkvist_enc_status').textContent = text;
  if(text)
    setTimeout(function(){set_status('');}, 5000);
}

function password_prompt() {
  var pass = prompt("Password");
  if(pass){
    password = pass;
    localStorage['password'] = password;
    set_status(strings.pass_entered);
    autodecrypt(document);
  } else {
    set_status(strings.no_pass);
  }
}

// keyboard shortcuts!
document.onkeydown = function(e) {
  if ((e.which === 219 || e.which === 221) && e.ctrlKey && e.shiftKey) {
    password_prompt();
  }
  if (e.which === 219 && e.ctrlKey && !e.shiftKey) { // [
    set_encryption_status(false);
  }
  if (e.which === 221 && e.ctrlKey && !e.shiftKey) { // ]
    if(!password) password_prompt();
    set_encryption_status(true);
  }
}

function hasClass(ele, klass){
  var regex =  new RegExp('\\s'+klass+'\\s');
  return regex.test(' '+ele.className+' ');
}

// monitor the dom for anything to decrypt

document.addEventListener("DOMNodeInserted", function(e) {
  if(e.target.nodeType == Node.ELEMENT_NODE){
    autodecrypt(e.target);
    addEncryptButton(e.target);
  }
}, false);

function encryptTextarea(ele){
  try {
    var res = sjcl.encrypt(password, ele.value, p, rp);
  } catch (e) {
    console.log('failed to encrypt');
  }
  if (res) {
    ele.value = res;
  }
}

function addEncryptButton(doc){
  var all_eles = [];
  var regex =  new RegExp('\\seditor_cancel\\s');
  if(regex.test(' '+doc.className+' ')){
  } else {
    var eles = doc.getElementsByClassName('editor_cancel');
    for(var i = 0; i < eles.length; i++){
      all_eles.push(eles[i]);
    }
  }
  for (i = 0; i < all_eles.length; i++) {
    var ele = all_eles[i];

    // insert encrypt button
    var button = document.createElement('input');
    button.type = "submit";
    button.value = "encrypt";
    button.onclick = function(){
      var ele = this.parentNode.getElementsByTagName('textarea')[0];
      encryptTextarea(ele);
    }
    ele.parentNode.insertBefore(button, ele);

    // insert encryption status checkbox
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.id = "checkvist_enc_status_checkbox";
    checkbox.onclick = function(){
      toggle_encryption_status();
      if(get_encryption_status()){
        var ele = this.parentNode.getElementsByTagName('textarea')[0];
        encryptTextarea(ele);
      }
    }
    if(get_encryption_status())
      checkbox.checked = true;
    ele.parentNode.insertBefore(checkbox, ele);

    // set up listener for textarea submission
    ele.parentNode.getElementsByTagName('textarea')[0].onkeydown = function(e){
      if(e.keyCode == 13) {
        if(get_encryption_status() == true){
          encryptTextarea(e.srcElement);
        }
      }
    }
  }
}

// perform the decryption
function do_autodecrypt(ct){
  var pt, jct;
  try {
    jct = JSON.parse(ct);
  } catch (e) {
    // not a valid json
  }
  if (jct && jct.adata == 'autodecrypt') {
    try {
      pt = sjcl.decrypt(password, ct, {}, rp);
    } catch (e) {
      set_status('Wrong password.');
    }
  }
  return pt || ct;
}


function toggle_encryption_status(){
  set_encryption_status(!get_encryption_status());
}

function set_encryption_status(status){
  if(status){
    should_encrypt = true;
  } else {
    should_encrypt = false;
  }
  var ele = document.getElementById('checkvist_enc_status_checkbox');
  if(ele) ele.checked = should_encrypt;
}

function get_encryption_status(){
  return should_encrypt;
}

function autodecrypt(doc) {
  var i, eles, ele, ct, pt;
  if (password !== '') {

    // decrypt text in textareas
    var all_eles = [];
    if(hasClass(doc, 'editor_field')) {
      all_eles.push(doc);
    } else {
      eles = doc.getElementsByClassName('editor_field');
      for(var i = 0; i < eles.length; i++){
        all_eles.push(eles[i]);
      }
    }
    for (i = 0; i < all_eles.length; i++) {
      set_encryption_status(false);
      ele = all_eles[i];
      ct = ele.value;
      pt = do_autodecrypt(ct);
      if(pt){
        ele.value = pt;
        ele.className = "decrypted";
        if(pt != ct){
          set_encryption_status(true);
        }
      }
    }

    // decrypt text in p tags
    all_eles = [];
    if(hasClass(doc, 'node_text') || hasClass(doc, 'commentText')){
      all_eles.push(doc);
    } else {
      eles = doc.getElementsByClassName('node_text'); //and check the current node
      for(i = 0; i < eles.length; i++){
        all_eles.push(eles[i]);
      }
      eles = doc.getElementsByClassName('commentText');
      for(i = 0; i < eles.length; i++){
        all_eles.push(eles[i]);
      }
    }
    for (i = 0; i < all_eles.length; i++) {
      ele = all_eles[i];
      if (ele) {
        ct = ele.textContent;
        if (ct) {
          var success = false;
          if (ct[0] === '{') {
            pt = do_autodecrypt(ct);
            if(pt != ct){
              // preserve new lines
              pt = pt.replace(/\n/g, "--NeWlInE--");
              ele.textContent = pt;
              ele.innerHTML = ele.textContent.replace(/--NeWlInE--/g, "<br/>");
              ele.className = "decrypted";
            }
          }
        }
      }
    }
  }
}


// add shortcuts info in the sidebar
function add_shortcut_info() {
  var sidenotes = document.getElementsByClassName('sidenotes');
  if(sidenotes.length > 0){
    var ele = sidenotes[0].getElementsByTagName('dl')[0];
    ele.innerHTML += '<dt>Ctrl+[</dt>'+
    '<dd>Decrypt (inside an edit box)</dd>'+
    '<dt>Ctrl+]</dt>'+
    '<dd>Encrypt (inside an edit box)</dd>'+
    '<dt>Ctrl+{</dt>'+
    '<dd>Set password</dd>';
  }
}

insert_status_ele();
add_shortcut_info();