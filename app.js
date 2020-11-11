require('dotenv').config();
const express=require("express");
const app=express();
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

mongoose.connect(process.env.DB_URL,{useNewUrlParser:true,useUnifiedTopology:true});
const itemSchema={
  name:String
};
const Item=mongoose.model("Item",itemSchema);

const item1=new Item({
  name:"Welcome to your ToDo List"
});

const item2=new Item({
  name:"Hit the + button to add a new item"
});

const item3=new Item({
  name:"Check the item to delete it"
});

const defaultItems=[item1,item2,item3];

const listSchema={
  name:String,
  items:[itemSchema]
};

const List=mongoose.model("List",listSchema);

app.get("/",function(req,res){
  Item.find({},function(err,foundItems){
    if(err){
      console.log(err);
    }
    else{
      if(foundItems.length===0){
        Item.insertMany(defaultItems,function(err){
          if(err){
            console.log(err);
          }
          else{
            console.log("Successfully inserted default items");
          }
        });
        res.redirect("/");
      }
      else{
        res.render("list",{listTitle:"Today",newListItems:foundItems});
      }
    }
  });
});

app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){
    if(err){
      console.log(err);
    }
    else{
      if(!foundList){
        const list=new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      }
    }
  });
});

app.post("/",function(req,res){
  const itemName=req.body.newItem;
  const listName=req.body.list;
  const item=new Item({
    name:itemName
  });
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about",function(req,res){
  res.render("about");
});

const PORT=process.env.PORT || 3000;
app.listen(PORT,function(){
  console.log('Server is running on '+PORT);
});
