package skills.service.controller.result.model

import skills.storage.model.SkillDef

class SkillDefRes {

    Integer id

    String skillId

    String projectId

    String name

    int pointIncrement

    // Time Window - in minute; 0 means that the action can be performed right away
    int pointIncrementInterval
    // Max Occurrences Within Window;
    int numMaxOccurrencesIncrementInterval

    int numPerformToCompletion
    int totalPoints

    int version

    SkillDef.ContainerType type
    // optional: in case of the container, indicate what type of container it is (ex. subject)
    String containerType

    String description

    String helpUrl

    int displayOrder

    Date created

    Date updated

    int numUsers
}
