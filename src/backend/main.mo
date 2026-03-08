import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// <CANDID_SETTINGS blobConversion="0">

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Category = {
    #LiveWebApp;
    #OfflineDesktopApp;
    #AndroidMobileApp;
    #VideoGame;
    #TherapyCompanionBot;
    #CustomAIAssistant;
    #Other : Text;
  };

  type Status = {
    #Planning;
    #InProgress;
    #OnHold;
    #Deployed;
    #Archived;
  };

  public type Language = {
    #HTML;
    #CSS;
    #JavaScript;
    #Markdown;
    #PlainText;
  };

  type Goal = {
    id : Nat;
    text : Text;
    completed : Bool;
  };

  type Milestone = {
    id : Nat;
    title : Text;
    completed : Bool;
    createdAt : Int;
  };

  type Project = {
    id : Nat;
    name : Text;
    category : Category;
    status : Status;
    description : Text;
    notes : Text;
    createdAt : Int;
    updatedAt : Int;
    goals : [Goal];
    milestones : [Milestone];
  };

  public type UserProfile = {
    name : Text;
  };

  public type Artifact = {
    id : Nat;
    projectId : Nat;
    filename : Text;
    language : Language;
    content : Text;
    createdAt : Int;
    updatedAt : Int;
    isPublished : Bool;
    publishedSlug : Text;
  };

  public type Revision = {
    id : Nat;
    artifactId : Nat;
    instruction : Text;
    previousContent : Text;
    createdAt : Int;
  };

  type GoalMutable = {
    var id : Nat;
    var text : Text;
    var completed : Bool;
  };

  type MilestoneMutable = {
    var id : Nat;
    var title : Text;
    var completed : Bool;
    var createdAt : Int;
  };

  type ProjectMutable = {
    var id : Nat;
    var name : Text;
    var category : Category;
    var status : Status;
    var description : Text;
    var notes : Text;
    var createdAt : Int;
    var updatedAt : Int;
    var goals : List.List<GoalMutable>;
    var milestones : List.List<MilestoneMutable>;
  };

  type ArtifactMutable = {
    var id : Nat;
    var projectId : Nat;
    var filename : Text;
    var language : Language;
    var content : Text;
    var createdAt : Int;
    var updatedAt : Int;
    var isPublished : Bool;
    var publishedSlug : Text;
  };

  let projects = Map.empty<Principal, Map.Map<Nat, ProjectMutable>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextId = 0;

  // New state after migration
  let artifacts = Map.empty<
    Principal,
    Map.Map<Nat, ArtifactMutable>
  >();
  let slugIndex = Map.empty<Text, { owner : Principal; artifactId : Nat }>();
  let revisionsMap = Map.empty<Principal, Map.Map<Nat, List.List<Revision>>>();

  func getNextId() : Nat {
    let id = nextId;
    nextId += 1;
    id;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func toImmutableGoal(g : GoalMutable) : Goal {
    {
      id = g.id;
      text = g.text;
      completed = g.completed;
    };
  };

  func toImmutableMilestone(m : MilestoneMutable) : Milestone {
    {
      id = m.id;
      title = m.title;
      completed = m.completed;
      createdAt = m.createdAt;
    };
  };

  func toImmutableProject(p : ProjectMutable) : Project {
    {
      id = p.id;
      name = p.name;
      category = p.category;
      status = p.status;
      description = p.description;
      notes = p.notes;
      createdAt = p.createdAt;
      updatedAt = p.updatedAt;
      goals = p.goals.map<GoalMutable, Goal>(toImmutableGoal).toArray();
      milestones = p.milestones.map<MilestoneMutable, Milestone>(toImmutableMilestone).toArray();
    };
  };

  func toImmutableArtifact(a : ArtifactMutable) : Artifact {
    {
      id = a.id;
      projectId = a.projectId;
      filename = a.filename;
      language = a.language;
      content = a.content;
      createdAt = a.createdAt;
      updatedAt = a.updatedAt;
      isPublished = a.isPublished;
      publishedSlug = a.publishedSlug;
    };
  };

  // Project CRUD (unchanged)
  public shared ({ caller }) func createProject(name : Text, category : Category, description : Text) : async Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };
    let id = getNextId();
    let projectMutable : ProjectMutable = {
      var id;
      var name;
      var category;
      var status = #Planning;
      var description;
      var notes = "";
      var createdAt = Time.now();
      var updatedAt = Time.now();
      var goals = List.empty<GoalMutable>();
      var milestones = List.empty<MilestoneMutable>();
    };

    let userProjects = switch (projects.get(caller)) {
      case (null) {
        let newMap = Map.empty<Nat, ProjectMutable>();
        newMap;
      };
      case (?map) { map };
    };

    userProjects.add(id, projectMutable);
    projects.add(caller, userProjects);
    toImmutableProject(projectMutable);
  };

  public query ({ caller }) func getProjects() : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch projects");
    };
    getProjectsInternal(caller);
  };

  public query ({ caller }) func getProject(id : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch projects");
    };
    getProjectInternal(caller, id);
  };

  public shared ({ caller }) func updateProject(id : Nat, name : Text, category : ?Category, status : ?Status, description : ?Text, notes : ?Text) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };
    updateProjectInternal(caller, id, name, category, status, description, notes);
  };

  public shared ({ caller }) func deleteProject(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };
    deleteProjectInternal(caller, id);
  };

  public shared ({ caller }) func addGoal(projectId : Nat, text : Text) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add goals");
    };
    addGoalInternal(caller, projectId, text);
  };

  public shared ({ caller }) func toggleGoal(projectId : Nat, goalId : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle goals");
    };
    toggleGoalInternal(caller, projectId, goalId);
  };

  public shared ({ caller }) func deleteGoal(projectId : Nat, goalId : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete goals");
    };
    deleteGoalInternal(caller, projectId, goalId);
  };

  public shared ({ caller }) func addMilestone(projectId : Nat, title : Text) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add milestones");
    };
    addMilestoneInternal(caller, projectId, title);
  };

  public shared ({ caller }) func toggleMilestone(projectId : Nat, milestoneId : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle milestones");
    };
    toggleMilestoneInternal(caller, projectId, milestoneId);
  };

  public shared ({ caller }) func deleteMilestone(projectId : Nat, milestoneId : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete milestones");
    };
    deleteMilestoneInternal(caller, projectId, milestoneId);
  };

  // Project CRUD Helper Functions
  func getProjectsInternal(caller : Principal) : [Project] {
    switch (projects.get(caller)) {
      case (null) { [] };
      case (?userProjects) {
        userProjects.values().map(toImmutableProject).toArray();
      };
    };
  };

  func getProjectInternal(caller : Principal, id : Nat) : ?Project {
    switch (projects.get(caller)) {
      case (null) { null };
      case (?userProjects) {
        userProjects.get(id).map(toImmutableProject);
      };
    };
  };

  func updateProjectInternal(caller : Principal, id : Nat, name : Text, category : ?Category, status : ?Status, description : ?Text, notes : ?Text) : ?Project {
    switch (projects.get(caller)) {
      case (null) { null };
      case (?userProjects) {
        switch (userProjects.get(id)) {
          case (null) { null };
          case (?projectMutable) {
            projectMutable.name := name;
            projectMutable.category := switch (category) { case (null) { projectMutable.category }; case (?c) { c } };
            projectMutable.status := switch (status) { case (null) { projectMutable.status }; case (?s) { s } };
            projectMutable.description := switch (description) { case (null) { projectMutable.description }; case (?d) { d } };
            projectMutable.notes := switch (notes) { case (null) { projectMutable.notes }; case (?n) { n } };
            projectMutable.updatedAt := Time.now();
            ?toImmutableProject(projectMutable);
          };
        };
      };
    };
  };

  func deleteProjectInternal(caller : Principal, id : Nat) : Bool {
    switch (projects.get(caller)) {
      case (null) { false };
      case (?userProjects) {
        let existed = userProjects.containsKey(id);
        userProjects.remove(id);
        projects.add(caller, userProjects);
        existed;
      };
    };
  };

  func addGoalInternal(caller : Principal, projectId : Nat, text : Text) : ?Project {
    switch (projects.get(caller)) {
      case (null) { null };
      case (?userProjects) {
        switch (userProjects.get(projectId)) {
          case (null) { null };
          case (?projectMutable) {
            let goalMutable = {
              var id = getNextId();
              var text;
              var completed = false;
            };
            projectMutable.goals.add(goalMutable);
            projectMutable.updatedAt := Time.now();
            ?toImmutableProject(projectMutable);
          };
        };
      };
    };
  };

  func toggleGoalInternal(caller : Principal, projectId : Nat, goalId : Nat) : ?Project {
    switch (projects.get(caller)) {
      case (null) { null };
      case (?userProjects) {
        switch (userProjects.get(projectId)) {
          case (null) { null };
          case (?projectMutable) {
            let goalsArray = if (projectMutable.goals.size() == 0) {
              [];
            } else {
              projectMutable.goals.toArray();
            };
            let newGoals = goalsArray.map(
              func(goalMutable) {
                if (goalMutable.id == goalId) {
                  {
                    var id = goalMutable.id;
                    var text = goalMutable.text;
                    var completed = not (goalMutable.completed);
                  };
                } else { goalMutable };
              }
            );
            projectMutable.goals := List.fromArray(newGoals);
            projectMutable.updatedAt := Time.now();
            ?toImmutableProject(projectMutable);
          };
        };
      };
    };
  };

  func deleteGoalInternal(caller : Principal, projectId : Nat, goalId : Nat) : ?Project {
    switch (projects.get(caller)) {
      case (null) { null };
      case (?userProjects) {
        switch (userProjects.get(projectId)) {
          case (null) { null };
          case (?projectMutable) {
            let newGoals = if (projectMutable.goals.size() == 0) {
              let emptyList = List.empty<GoalMutable>();
              emptyList;
            } else {
              projectMutable.goals.filter(func(goalMutable) { goalMutable.id != goalId });
            };
            projectMutable.goals := newGoals;
            projectMutable.updatedAt := Time.now();
            ?toImmutableProject(projectMutable);
          };
        };
      };
    };
  };

  func addMilestoneInternal(caller : Principal, projectId : Nat, title : Text) : ?Project {
    switch (projects.get(caller)) {
      case (null) { null };
      case (?userProjects) {
        switch (userProjects.get(projectId)) {
          case (null) { null };
          case (?projectMutable) {
            let milestoneMutable = {
              var id = getNextId();
              var title;
              var completed = false;
              var createdAt = Time.now();
            };
            projectMutable.milestones.add(milestoneMutable);
            projectMutable.updatedAt := Time.now();
            ?toImmutableProject(projectMutable);
          };
        };
      };
    };
  };

  func toggleMilestoneInternal(caller : Principal, projectId : Nat, milestoneId : Nat) : ?Project {
    switch (projects.get(caller)) {
      case (null) { null };
      case (?userProjects) {
        switch (userProjects.get(projectId)) {
          case (null) { null };
          case (?projectMutable) {
            let milestonesArray = if (projectMutable.milestones.size() == 0) {
              [];
            } else {
              projectMutable.milestones.toArray();
            };
            let newMilestones = milestonesArray.map(
              func(milestoneMutable) {
                if (milestoneMutable.id == milestoneId) {
                  {
                    var id = milestoneMutable.id;
                    var title = milestoneMutable.title;
                    var completed = not milestoneMutable.completed;
                    var createdAt = milestoneMutable.createdAt;
                  };
                } else { milestoneMutable };
              }
            );
            projectMutable.milestones := List.fromArray(newMilestones);
            projectMutable.updatedAt := Time.now();
            ?toImmutableProject(projectMutable);
          };
        };
      };
    };
  };

  func deleteMilestoneInternal(caller : Principal, projectId : Nat, milestoneId : Nat) : ?Project {
    switch (projects.get(caller)) {
      case (null) { null };
      case (?userProjects) {
        switch (userProjects.get(projectId)) {
          case (null) { null };
          case (?projectMutable) {
            let newMilestones = if (projectMutable.milestones.size() == 0) {
              let emptyList = List.empty<MilestoneMutable>();
              emptyList;
            } else {
              projectMutable.milestones.filter(func(milestoneMutable) { milestoneMutable.id != milestoneId });
            };
            projectMutable.milestones := newMilestones;
            projectMutable.updatedAt := Time.now();
            ?toImmutableProject(projectMutable);
          };
        };
      };
    };
  };

  // Artifact Management
  public shared ({ caller }) func createArtifact(projectId : Nat, filename : Text, language : Language, content : Text) : async Artifact {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create artifacts");
    };

    switch (projects.get(caller)) {
      case (null) { Runtime.trap("Project not found") };
      case (?userProjects) {
        if (not userProjects.containsKey(projectId)) {
          Runtime.trap("Project not found");
        };
      };
    };

    let id = getNextId();
    let artifactMutable : ArtifactMutable = {
      var id;
      var projectId;
      var filename;
      var language;
      var content;
      var createdAt = Time.now();
      var updatedAt = Time.now();
      var isPublished = false;
      var publishedSlug = "";
    };

    let userArtifacts = switch (artifacts.get(caller)) {
      case (null) {
        let newMap = Map.empty<Nat, ArtifactMutable>();
        newMap;
      };
      case (?map) { map };
    };

    userArtifacts.add(id, artifactMutable);
    artifacts.add(caller, userArtifacts);

    toImmutableArtifact(artifactMutable);
  };

  public query ({ caller }) func getArtifacts(projectId : Nat) : async [Artifact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch artifacts");
    };
    getArtifactsInternal(caller, projectId);
  };

  public query ({ caller }) func getArtifact(id : Nat) : async ?Artifact {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch artifacts");
    };
    getArtifactInternal(caller, id);
  };

  public shared ({ caller }) func updateArtifact(id : Nat, filename : ?Text, language : ?Language, content : ?Text) : async ?Artifact {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update artifacts");
    };
    updateArtifactInternal(caller, id, filename, language, content);
  };

  public shared ({ caller }) func deleteArtifact(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete artifacts");
    };
    deleteArtifactInternal(caller, id);
  };

  public shared ({ caller }) func publishArtifact(id : Nat) : async ?Artifact {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can publish artifacts");
    };
    publishArtifactInternal(caller, id);
  };

  public shared ({ caller }) func unpublishArtifact(id : Nat) : async ?Artifact {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unpublish artifacts");
    };
    unpublishArtifactInternal(caller, id);
  };

  public query ({ caller }) func getPublicArtifact(slug : Text) : async ?Artifact {
    getPublicArtifactInternal(slug);
  };

  func getArtifactsInternal(caller : Principal, projectId : Nat) : [Artifact] {
    switch (artifacts.get(caller)) {
      case (null) { [] };
      case (?userArtifacts) {
        let filtered = userArtifacts.values().filter(func(a : ArtifactMutable) : Bool {
          a.projectId == projectId
        });
        filtered.map(toImmutableArtifact).toArray();
      };
    };
  };

  func getArtifactInternal(caller : Principal, id : Nat) : ?Artifact {
    switch (artifacts.get(caller)) {
      case (null) { null };
      case (?userArtifacts) {
        userArtifacts.get(id).map(toImmutableArtifact);
      };
    };
  };

  func updateArtifactInternal(caller : Principal, id : Nat, filename : ?Text, language : ?Language, content : ?Text) : ?Artifact {
    switch (artifacts.get(caller)) {
      case (null) { null };
      case (?userArtifacts) {
        switch (userArtifacts.get(id)) {
          case (null) { null };
          case (?artifactMutable) {
            artifactMutable.filename := switch (filename) { case (null) { artifactMutable.filename }; case (?f) { f } };
            artifactMutable.language := switch (language) { case (null) { artifactMutable.language }; case (?l) { l } };
            artifactMutable.content := switch (content) { case (null) { artifactMutable.content }; case (?c) { c } };
            artifactMutable.updatedAt := Time.now();
            ?toImmutableArtifact(artifactMutable);
          };
        };
      };
    };
  };

  func deleteArtifactInternal(caller : Principal, id : Nat) : Bool {
    switch (artifacts.get(caller)) {
      case (null) { false };
      case (?userArtifacts) {
        switch (userArtifacts.get(id)) {
          case (null) { false };
          case (?artifactMutable) {
            if (artifactMutable.isPublished) {
              slugIndex.remove(artifactMutable.publishedSlug);
            };
            userArtifacts.remove(id);
            artifacts.add(caller, userArtifacts);
            true;
          };
        };
      };
    };
  };

  func publishArtifactInternal(caller : Principal, id : Nat) : ?Artifact {
    switch (artifacts.get(caller)) {
      case (null) { null };
      case (?userArtifacts) {
        switch (userArtifacts.get(id)) {
          case (null) { null };
          case (?artifactMutable) {
            let slug = artifactMutable.filename # "-" # debug_show (id);
            artifactMutable.isPublished := true;
            artifactMutable.publishedSlug := slug;
            slugIndex.add(slug, { owner = caller; artifactId = id });
            ?toImmutableArtifact(artifactMutable);
          };
        };
      };
    };
  };

  func unpublishArtifactInternal(caller : Principal, id : Nat) : ?Artifact {
    switch (artifacts.get(caller)) {
      case (null) { null };
      case (?userArtifacts) {
        switch (userArtifacts.get(id)) {
          case (null) { null };
          case (?artifactMutable) {
            let slug = artifactMutable.publishedSlug;
            artifactMutable.isPublished := false;
            artifactMutable.publishedSlug := "";
            if (slug != "") {
              slugIndex.remove(slug);
            };
            ?toImmutableArtifact(artifactMutable);
          };
        };
      };
    };
  };

  func getPublicArtifactInternal(slug : Text) : ?Artifact {
    switch (slugIndex.get(slug)) {
      case (null) { null };
      case (?{ owner; artifactId }) {
        switch (artifacts.get(owner)) {
          case (null) { null };
          case (?userArtifacts) {
            switch (userArtifacts.get(artifactId)) {
              case (null) { null };
              case (?artifactMutable) {
                if (artifactMutable.isPublished) { ?toImmutableArtifact(artifactMutable) } else {
                  null;
                };
              };
            };
          };
        };
      };
    };
  };

  // Revision Management
  public shared ({ caller }) func addRevision(artifactId : Nat, instruction : Text, previousContent : Text) : async ?[Revision] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add revisions");
    };

    switch (artifacts.get(caller)) {
      case (null) { Runtime.trap("Artifact not found") };
      case (?userArtifacts) {
        if (not userArtifacts.containsKey(artifactId)) {
          Runtime.trap("Artifact not found");
        };
      };
    };

    let id = getNextId();
    let revision : Revision = {
      id;
      artifactId;
      instruction;
      previousContent;
      createdAt = Time.now();
    };

    let userRevisions = switch (revisionsMap.get(caller)) {
      case (null) {
        let newMap = Map.empty<Nat, List.List<Revision>>();
        newMap;
      };
      case (?map) { map };
    };

    let artifactRevisions = switch (userRevisions.get(artifactId)) {
      case (null) { List.empty<Revision>() };
      case (?list) { list };
    };

    artifactRevisions.add(revision);
    userRevisions.add(artifactId, artifactRevisions);
    revisionsMap.add(caller, userRevisions);

    ?artifactRevisions.toArray();
  };

  public query ({ caller }) func getRevisions(artifactId : Nat) : async [Revision] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch revisions");
    };

    switch (artifacts.get(caller)) {
      case (null) { [] };
      case (?userArtifacts) {
        if (not userArtifacts.containsKey(artifactId)) {
          [];
        } else {
          getRevisionsInternal(caller, artifactId);
        };
      };
    };
  };

  func getRevisionsInternal(caller : Principal, artifactId : Nat) : [Revision] {
    switch (revisionsMap.get(caller)) {
      case (null) { [] };
      case (?userRevisions) {
        switch (userRevisions.get(artifactId)) {
          case (null) { [] };
          case (?revisionsList) { revisionsList.toArray() };
        };
      };
    };
  };
};


