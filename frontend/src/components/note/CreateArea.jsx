import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { Fab, Zoom, CircularProgress } from "@mui/material";

function CreateArea(props) {
  const [isExpanded, setExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Nowy stan

  const [note, setNote] = useState({
    title: "",
    content: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setNote((prevNote) => {
      return {
        ...prevNote,
        [name]: value,
      };
    });
  }

 async function submitNote(event) {
    event.preventDefault();
    
    if (!note.content.trim()) {
      alert("Treść notatki nie może być pusta");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await props.onAdd(note);
      setNote({
        title: "",
        content: "",
      });
      setExpanded(false); 
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function expand() {
    setExpanded(true);
  }

  return (
    <div>
      <form className="create-note" onSubmit={submitNote}>
        {isExpanded && (
          <input
            name="title"
            onChange={handleChange}
            value={note.title}
            placeholder="Title"
            disabled={isSubmitting}
          />
        )}

        <textarea
          name="content"
          onClick={expand}
          onChange={handleChange}
          value={note.content}
          placeholder="Take a note..."
          rows={isExpanded ? 3 : 1}
           disabled={isSubmitting}
        />
        <Zoom in={isExpanded}>
          <Fab type="submit" disabled={isSubmitting}>
             {isSubmitting ? <CircularProgress size={24} /> : <AddIcon />}
          </Fab>
        </Zoom>
      </form>
    </div>
  );
}

export default CreateArea;
